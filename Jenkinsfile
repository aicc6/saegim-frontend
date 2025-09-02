pipeline {
  agent any

  // ✅ 기본 Checkout 비활성화 (중복 checkout 방지)
  options {
    skipDefaultCheckout(true)
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
    // ====== 레지스트리/자격증명 (Jenkins 환경변수에서 자동 읽힘) ======
    // 우선순위: Job/글로벌의 DOCKER_REGISTRY → CUSTOM_DOCKER_REGISTRY
    DOCKER_REGISTRY     = "${env.DOCKER_REGISTRY ?: env.CUSTOM_DOCKER_REGISTRY}"

    // 우선순위: Job/글로벌의 DOCKER_CREDENTIALS → CUSTOM_DOCKER_CREDENTIALS
    DOCKER_CREDENTIALS  = "${env.DOCKER_CREDENTIALS ?: env.CUSTOM_DOCKER_CREDENTIALS}"

    // 이미지 이름 (조직 규칙에 맞춰 필요시 변경)
    DOCKER_IMAGE        = "${env.DOCKER_IMAGE ?: 'aicc/saegim-frontend'}"

    NODE_ENV            = "production"
  }

  stages {
    // ✅ 브랜치 정규화
    stage('Resolve Branch') {
      steps {
        script {
          // 브랜치 표기 정규화: refs/heads/, remotes/origin/, origin/ 제거
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
          branches: [[name: "*/${env.EFFECTIVE_BRANCH}"]],
          userRemoteConfigs: [[
            url: 'https://github.com/aicc6/saegim-frontend.git'
          ]]
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
            error "DOCKER_REGISTRY가 비어 있습니다. Jenkins 환경변수에서 설정하세요."
          }
          if (!env.DOCKER_CREDENTIALS?.trim()) {
            error "DOCKER_CREDENTIALS가 비어 있습니다. Jenkins Credentials ID를 환경변수로 지정하세요."
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

    /* ⛔️ 삭제: 에이전트에 Node/npm 없음 → Dockerfile에서 빌드하므로 불필요
    stage('Install') { ... }
    stage('Test')   { ... }
    stage('Build App') { ... }
    */

    // (선택) 필요한 빌드 인자 검증—비어있으면 명확한 에러로 종료
    stage('Validate Build Args') {
      steps {
        sh '''
          : "${NEXT_PUBLIC_API_BASE_URL:?NEXT_PUBLIC_API_BASE_URL is required}"
          : "${GOOGLE_REDIRECT_URI:?GOOGLE_REDIRECT_URI is required}"
          # 아래 값들도 Jenkins 환경변수로 등록돼 있다면 주석 해제하여 검증 가능
          # : "${NEXT_PUBLIC_FIREBASE_API_KEY:?required}"
          # : "${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:?required}"
          # : "${NEXT_PUBLIC_FIREBASE_PROJECT_ID:?required}"
          # : "${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:?required}"
          # : "${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:?required}"
          # : "${NEXT_PUBLIC_FIREBASE_APP_ID:?required}"
          # : "${NEXT_PUBLIC_FIREBASE_VAPID_KEY:?required}"
        '''
      }
    }

    stage('Docker Build & Push') {
      steps {
        script {
          def imageBase = "${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE}"
          def tagBuild  = "${imageBase}:${env.BUILD_NUMBER}"
          def tagLatest = "${imageBase}:latest"

          sh """
            set +e
            docker pull ${tagLatest} || true
            set -e

            docker build \\
              --build-arg NEXT_PUBLIC_API_BASE_URL=${env.NEXT_PUBLIC_API_BASE_URL} \\
              --build-arg GOOGLE_REDIRECT_URI=${env.GOOGLE_REDIRECT_URI} \\
              --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=${env.NEXT_PUBLIC_FIREBASE_API_KEY} \\
              --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN} \\
              --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID} \\
              --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET} \\
              --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID} \\
              --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=${env.NEXT_PUBLIC_FIREBASE_APP_ID} \\
              --build-arg NEXT_PUBLIC_FIREBASE_VAPID_KEY=${env.NEXT_PUBLIC_FIREBASE_VAPID_KEY} \\
              -t ${tagBuild} -t ${tagLatest} .

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
      echo '❌ 실패 — 콘솔 로그에서 NEXUS 로그인/태그/푸시 단계 확인'
    }
  }
}
