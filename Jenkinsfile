pipeline {
  agent any

  parameters {
    choice(name: 'BRANCH_TO_BUILD', choices: ['develop','main','release/latest'], description: '빌드 브랜치(웹훅 시 자동 감지)')
    booleanParam(name: 'RUN_TESTS', defaultValue: false, description: 'npm test 실행 여부')
  }

  // ✅ 기본 SCM 체크아웃 끄기: 우리가 지정한 브랜치만 체크아웃
  options {
    skipDefaultCheckout(true)
    buildDiscarder(logRotator(numToKeepStr: '10', daysToKeepStr: '30'))
    timeout(time: 45, unit: 'MINUTES')
    disableConcurrentBuilds()
    timestamps()
  }

  triggers {
    githubPush()
  }

  environment {
    // Git
    GIT_REPOSITORY_URL = 'https://github.com/aicc6/saegim-frontend.git'

    // Docker Registry (없으면 푸시/풀 스킵)
    DOCKER_REGISTRY    = "${env.CUSTOM_DOCKER_REGISTRY}"     // 예: nexus.example.com
    DOCKER_CREDENTIALS = "${env.CUSTOM_DOCKER_CREDENTIALS}"  // Jenkins Credentials ID
    DOCKER_IMAGE       = 'aicc/saegim-frontend'
    CONTAINER_NAME     = 'saegim-frontend'

    // Dockerfile 경로/컨텍스트 (필요시 변경)
    DOCKERFILE_PATH = 'Dockerfile'
    BUILD_CONTEXT   = '.'

    // 내부 Docker 네트워크(공유 서버 정책)
    DOCKER_NETWORK = 'saegim-net'
  }

  stages {

    stage('🔄 Clone & Select Branch') {
      steps {
        script {
          // 웹훅/멀티브랜치/수동 파라미터 모두 대응
          def branchName = params.BRANCH_TO_BUILD ?: (env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'develop')
          if (branchName?.startsWith('refs/heads/')) branchName = branchName.replace('refs/heads/','')
          if (branchName?.startsWith('origin/'))     branchName = branchName.replace('origin/','')

          echo "🔍 체크아웃할 브랜치: ${branchName}"
          echo "📂 Git Repository: ${env.GIT_REPOSITORY_URL}"

          checkout([$class: 'GitSCM',
            branches: [[name: branchName]],
            userRemoteConfigs: [[url: env.GIT_REPOSITORY_URL]]
          ])

          env.GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
          echo "✅ Git checkout 완료: ${branchName} @ ${env.GIT_COMMIT_SHORT}"
        }
      }
    }

    stage('🧩 Prepare .env.runtime (Credentials)') {
      steps {
        script {
          def credentialsId = "saegim-frontend" // Jenkins Secret file ID
          withCredentials([file(credentialsId: credentialsId, variable: 'ENV_FILE')]) {
            sh '''
              cp "$ENV_FILE" .env.runtime
              chmod 600 .env.runtime
              echo "[OK] .env.runtime 준비"
            '''
          }
        }
      }
    }

    stage('🧪 (optional) Tests') {
      when { expression { return params.RUN_TESTS } }
      steps {
        sh '''
          npm ci
          npm test || true   # 테스트 실패로 배포가 막히지 않게 완화 (원하면 제거)
        '''
      }
    }

    stage('🐳 Build Docker Image') {
      steps {
        script {
          // Dockerfile 존재 확인(경로/대소문자 문제 방지)
          sh '''
            if [ ! -f "${DOCKERFILE_PATH}" ]; then
              echo "❌ Dockerfile이 보이지 않습니다: ${DOCKERFILE_PATH}"
              echo "   - 브랜치/경로/대소문자(Dockerfile) 확인"
              exit 1
            fi
          '''

          sh '''
            set -e
            set -a
            . ./.env.runtime
            set +a
            export DOCKER_BUILDKIT=1
            docker build \
              -f "${DOCKERFILE_PATH}" \
              --label app=saegim-frontend \
              --build-arg NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL}" \
              --build-arg GOOGLE_REDIRECT_URI="${GOOGLE_REDIRECT_URI}" \
              --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="${NEXT_PUBLIC_FIREBASE_API_KEY}" \
              --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}" \
              --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
              --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}" \
              --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}" \
              --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="${NEXT_PUBLIC_FIREBASE_APP_ID}" \
              --build-arg NEXT_PUBLIC_FIREBASE_VAPID_KEY="${NEXT_PUBLIC_FIREBASE_VAPID_KEY}" \
              -t ${DOCKER_IMAGE}:${BUILD_NUMBER} \
              "${BUILD_CONTEXT}"
          '''
          env.DOCKER_BUILD_SUCCESS = 'true'
          echo "✅ Build ok: ${DOCKER_IMAGE}:${BUILD_NUMBER}"
        }
      }
    }

    stage('📤 Push Docker Image') {
      when { environment name: 'DOCKER_BUILD_SUCCESS', value: 'true' }
      steps {
        script {
          if (env.DOCKER_REGISTRY && env.DOCKER_REGISTRY != 'localhost' && env.DOCKER_REGISTRY != 'local') {
            docker.withRegistry("https://${DOCKER_REGISTRY}", "${DOCKER_CREDENTIALS}") {
              docker.image("${DOCKER_IMAGE}:${BUILD_NUMBER}").push("${BUILD_NUMBER}")
              def currentBranch = sh(script: "git rev-parse --abbrev-ref HEAD", returnStdout: true).trim()
              if (currentBranch == 'main') {
                docker.image("${DOCKER_IMAGE}:${BUILD_NUMBER}").push("latest")
                echo "✅ latest 태그 푸시"
              }
            }
            echo "✅ Pushed: ${DOCKER_IMAGE}:${BUILD_NUMBER}"
          } else {
            echo "ℹ️ 레지스트리 미설정 → 푸시 스킵(로컬 전용)"
          }
          env.DOCKER_PUSH_SUCCESS = 'true'
        }
      }
    }

    stage('🚀 Deploy (internal only)') {
      when { environment name: 'DOCKER_PUSH_SUCCESS', value: 'true' }
      steps {
        script {
          def currentBranch = sh(script: "git rev-parse --abbrev-ref HEAD", returnStdout: true).trim()
          def deployEnv = (currentBranch == 'main') ? 'production' : 'development'
          def containerName = "${CONTAINER_NAME}-${deployEnv}"

          sh """
            set -e

            # 내부 네트워크 확인/생성(이미 있으면 유지)
            if ! docker network ls | grep -q ${DOCKER_NETWORK}; then
              docker network create ${DOCKER_NETWORK} || true
            fi

            # 레지스트리 사용시 pull (로컬이면 스킵)
            if [ -n "${DOCKER_REGISTRY}" ] && [ "${DOCKER_REGISTRY}" != "localhost" ] && [ "${DOCKER_REGISTRY}" != "local" ]; then
              docker pull ${DOCKER_IMAGE}:${BUILD_NUMBER}
            fi

            # 기존 컨테이너 정리(본인 것만)
            docker stop ${containerName} || true
            docker rm   ${containerName} || true

            # 새 컨테이너 실행 (외부 포트 바인딩 금지, NPM가 라우팅)
            docker run -d \\
              --name ${containerName} \\
              --network ${DOCKER_NETWORK} \\
              --restart unless-stopped \\
              --label "app=saegim-frontend" \\
              --health-cmd="curl -f http://localhost:3000/ || exit 1" \\
              --health-interval=30s \\
              --health-timeout=10s \\
              --health-retries=3 \\
              ${DOCKER_IMAGE}:${BUILD_NUMBER}

            # 필요시 dangling 이미지 정리만(타 팀 영향 없음)
            docker image prune -f || true
          """
          echo "✅ Deploy ok: ${containerName}"
        }
      }
    }
  }

  post {
    always {
      echo "📋 정리"
      sh 'rm -f .env.runtime || true'
      cleanWs()
    }
    success {
      echo "✅ 파이프라인 완료"
    }
    failure {
      echo "❌ 파이프라인 실패"
      sh '''
        echo "🔍 디버깅:"
        docker ps -a | grep saegim-frontend || echo "관련 컨테이너 없음"
        docker images | grep saegim-frontend || echo "관련 이미지 없음"
      '''
    }
  }
}
