pipeline {
  agent any

  options {
    // 기본 'Declarative: Checkout SCM' 비활성화 (중복 checkout 방지)
    skipDefaultCheckout(true)
    // 로그 깔끔하게
    ansiColor('xterm')
    timestamps()
  }

  parameters {
    choice(
      name: 'BRANCH_TO_BUILD',
      choices: ['develop', 'main', 'release/latest'],
      description: '수동 빌드시 체크아웃할 브랜치 (Webhook 시 자동감지)'
    )
    booleanParam(
      name: 'RUN_TESTS',
      defaultValue: false,
      description: 'npm test 실행 여부'
    )
  }

  triggers {
    githubPush()
  }

  environment {
    // ====== 레지스트리/크리덴셜 (Jenkins 환경변수에서 자동 읽힘) ======
    // 우선순위: Job/글로벌의 DOCKER_REGISTRY → CUSTOM_DOCKER_REGISTRY
    DOCKER_REGISTRY     = "${env.DOCKER_REGISTRY ?: env.CUSTOM_DOCKER_REGISTRY}"
    // 우선순위: Job/글로벌의 DOCKER_CREDENTIALS → CUSTOM_DOCKER_CREDENTIALS
    DOCKER_CREDENTIALS  = "${env.DOCKER_CREDENTIALS ?: env.CUSTOM_DOCKER_CREDENTIALS}"

    // 이미지 이름 (조직 규칙에 맞게 필요 시 변경)
    DOCKER_IMAGE        = "${env.DOCKER_IMAGE ?: 'aicc/saegim-frontend'}"

    NODE_ENV            = "production"
  }

  stages {
    stage('Resolve Branch') {
      steps {
        script {
          // 다양한 환경에서 들어오는 브랜치 표기를 안전하게 정규화
          // 예: refs/heads/develop, origin/develop, remotes/origin/develop → develop
          def ref = env.CHANGE_BRANCH ?: env.BRANCH_NAME ?: env.GIT_BRANCH ?: ''
          def cleaned = ref
            .replaceFirst(/^refs\/heads\//, '')
            .replaceFirst(/^remotes\/origin\//, '')
            .replaceFirst(/^origin\//, '')
            .trim()

          def paramBranch = params.BRANCH_TO_BUILD ?: 'develop'
          env.EFFECTIVE_BRANCH = cleaned ? cleaned : paramBranch

          echo "Using branch: ${env.EFFECTIVE_BRANCH}"
        }
      }
    }

    stage('Checkout') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[ name: "*/${env.EFFECTIVE_BRANCH}" ]],
          userRemoteConfigs: [[ url: 'https://github.com/aicc6/saegim-frontend.git' ]]
        ])
      }
    }

    stage('Show Env') {
      steps {
        sh '''
          echo "=== Effective Variables ==="
          echo "DOCKER_REGISTRY=${DOCKER_REGISTRY}"
          echo "DOCKER_CREDENTIALS=${DOCKER_CREDENTIALS}"
          echo "DOCKER_IMAGE=${DOCKER_IMAGE}"
          echo "BUILD_NUMBER=${BUILD_NUMBER}"
          echo "GIT_BRANCH=${GIT_BRANCH} | BRANCH_NAME=${BRANCH_NAME} | EFFECTIVE_BRANCH=${EFFECTIVE_BRANCH}"
        '''
      }
    }

    stage('Nexus Login') {
      steps {
        script {
          if (!env.DOCKER_REGISTRY?.trim()) {
            error "DOCKER_REGISTRY가 비어 있습니다. Jenkins 환경변수에서 설정하세요. (정확한 정보)"
          }
          if (!env.DOCKER_CREDENTIALS?.trim()) {
            error "DOCKER_CREDENTIALS가 비어 있습니다. Jenkins Credentials ID를 지정하세요. (정확한 정보)"
          }
        }
        withCredentials([usernamePassword(
          credentialsId: "${env.DOCKER_CREDENTIALS}",
          usernameVariable: 'REG_USER',
          passwordVariable: 'REG_PASS'
        )]) {
          sh '''
            set -e
            echo "Login to ${DOCKER_REGISTRY}"
            echo "${REG_PASS}" | docker login "${DOCKER_REGISTRY}" -u "${REG_USER}" --password-stdin
          '''
        }
      }
    }

    stage('Install') {
      steps {
        sh '''
          set -e
          corepack enable || true
          npm ci
        '''
      }
    }

    stage('Test') {
      when { expression { return params.RUN_TESTS } }
      steps {
        sh '''
          set -e
          npm test --if-present
        '''
      }
    }

    stage('Build App') {
      steps {
        sh '''
          set -e
          npm run build
        '''
      }
    }

    stage('Docker Build & Push') {
      steps {
        script {
          def imageBase = "${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE}"
          def tagBuild = "${imageBase}:${env.BUILD_NUMBER}"
          def tagLatest = "${imageBase}:latest"

          sh """
            set +e
            docker pull ${tagLatest} || true   # 캐시 없으면 실패 무시 (정확한 정보)
            set -e

            docker build -t ${tagBuild} -t ${tagLatest} .

            docker push ${tagBuild}
            docker push ${tagLatest}
          """
        }
      }
      post {
        always {
          sh 'docker logout || true'
        }
      }
    }
  }

  post {
    success {
      echo '✅ Build & Push 성공'
    }
    failure {
      echo '❌ 실패 — 콘솔 로그에서 브랜치/로그인/푸시 단계 확인'
    }
  }
}
