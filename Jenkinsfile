pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '30'))
    disableConcurrentBuilds()
  }

  parameters {
    choice(
      name: 'BRANCH_TO_BUILD',
      choices: ['develop', 'main', 'release/latest'],
      description: '수동 빌드시 체크아웃할 브랜치 (Webhook 시 자동 감지)'
    )
    booleanParam(
      name: 'RUN_TESTS',
      defaultValue: false,
      description: 'npm test 실행 여부'
    )
  }

  triggers { githubPush() }

  environment {
    // Git
    GIT_REPOSITORY_URL = 'https://github.com/aicc6/saegim-frontend.git'

    // Docker Registry(필요 시 설정). 예: nexus.aicc-project.com:8083
    DOCKER_REGISTRY    = "${env.DOCKER_REGISTRY ?: env.CUSTOM_DOCKER_REGISTRY}"
    DOCKER_CREDENTIALS = "${env.DOCKER_CREDENTIALS ?: env.CUSTOM_DOCKER_CREDENTIALS}"

    // 이미지 네이밍
    IMAGE_NAME = 'saegim-frontend'
  }

  stages {

    stage('Resolve Branch') {
      steps {
        script {
          // GitHub Webhook payload 환경변수에서 브랜치 추출 (없으면 파라미터 기본값)
          def ref = env.GIT_BRANCH ?: env.CHANGE_BRANCH ?: env.BRANCH_NAME ?: ''
          def autoBranch = ref ? ref.replaceFirst(/^origin\//, '') : ''
          env.TARGET_BRANCH = autoBranch ? autoBranch : (params.BRANCH_TO_BUILD ?: 'develop')
          echo "Using branch: ${env.TARGET_BRANCH}"
        }
      }
    }

    stage('Checkout') {
      steps {
        checkout([
          $class: 'GitSCM',
          userRemoteConfigs: [[url: "${env.GIT_REPOSITORY_URL}"]],
          branches: [[name: "*/${env.TARGET_BRANCH}"]],
          extensions: [[$class: 'CloneOption', shallow: true, depth: 10, noTags: false, reference: '']]
        ])

        script {
          sh 'git rev-parse HEAD'
          sh 'git rev-parse --short HEAD'
          env.GIT_SHORT_SHA = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        }
      }
    }

    stage('Detect Build Context') {
      steps {
        script {
          boolean hasFrontend = fileExists('frontend/Dockerfile')
          boolean hasRoot     = fileExists('Dockerfile')

          if (hasFrontend) {
            env.CONTEXT_DIR     = 'frontend'
            env.DOCKERFILE_PATH = 'frontend/Dockerfile'
          } else if (hasRoot) {
            env.CONTEXT_DIR     = '.'
            env.DOCKERFILE_PATH = 'Dockerfile'
          } else {
            error "No Dockerfile found in repo (checked: ./frontend/Dockerfile, ./Dockerfile)"
          }

          echo "Build Context: ${env.CONTEXT_DIR}"
          echo "Dockerfile   : ${env.DOCKERFILE_PATH}"
        }
      }
    }

    stage('Show Env') {
      steps {
        sh '''
          echo "=== ENV SNAPSHOT ==="
          echo "TARGET_BRANCH=${TARGET_BRANCH}"
          echo "CONTEXT_DIR=${CONTEXT_DIR}"
          echo "DOCKERFILE_PATH=${DOCKERFILE_PATH}"
          echo "DOCKER_REGISTRY=${DOCKER_REGISTRY}"
          echo "IMAGE_NAME=${IMAGE_NAME}"
          echo "GIT_SHORT_SHA=${GIT_SHORT_SHA}"
        '''
      }
    }

    stage('Nexus Login') {
      when {
        expression { return env.DOCKER_REGISTRY?.trim() && env.DOCKER_CREDENTIALS?.trim() }
      }
      steps {
        script {
          withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDENTIALS, usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
            sh '''
              echo "${REG_PASS}" | docker login "${DOCKER_REGISTRY}" -u "${REG_USER}" --password-stdin
              docker info
            '''
          }
        }
      }
    }

    stage('Prepare .env.local') {
      steps {
        script {
          // Jenkins Credentials(예: Secret file/text)로 주입했다면 여기에 파일 생성 로직 추가 가능
          // 없으면 스킵. Next.js 빌드가 꼭 필요하지 않다면 통과.
          if (fileExists('.env.local')) {
            echo '.env.local already exists — using it.'
          } else {
            echo 'No .env.local found — skipping creation.'
          }
        }
      }
    }

    stage('Test (optional)') {
      when { expression { return params.RUN_TESTS } }
      steps {
        dir("${env.CONTEXT_DIR}") {
          sh '''
            if [ -f "package.json" ]; then
              npm ci || npm install
              npm test --if-present
            else
              echo "No package.json — skipping tests"
            fi
          '''
        }
      }
    }

    stage('Docker Build & Push') {
      steps {
        script {
          def registryPrefix = env.DOCKER_REGISTRY?.trim() ? "${env.DOCKER_REGISTRY}/" : ""
          def imageTagLatest = "${registryPrefix}${env.IMAGE_NAME}:latest"
          def imageTagSha    = "${registryPrefix}${env.IMAGE_NAME}:${env.GIT_SHORT_SHA}"

          sh """
            docker build \\
              --file ${env.DOCKERFILE_PATH} \\
              --tag ${imageTagLatest} \\
              --tag ${imageTagSha} \\
              ${env.CONTEXT_DIR}
          """

          // 레지스트리 설정이 있으면 푸시, 없으면 로컬 테스트용으로만 빌드
          if (env.DOCKER_REGISTRY?.trim()) {
            sh """
              docker push ${imageTagLatest}
              docker push ${imageTagSha}
            """
          } else {
            echo "DOCKER_REGISTRY not set — skipping push (built locally only)."
          }
        }
      }
    }
  }

  post {
    success {
      echo "✅ 성공 — 이미지 빌드(및 필요 시 푸시) 완료"
    }
    failure {
      echo "❌ 실패 — 콘솔 로그에서 Detect Build Context 단계 및 변수 설정 확인"
    }
    always {
      sh '''
        set -e
        # 필요 시 docker logout 처리 (레지스트리 사용했을 때만)
        if [ -n "${DOCKER_REGISTRY}" ]; then
          docker logout "${DOCKER_REGISTRY}" || true
        fi
      '''
    }
  }
}
