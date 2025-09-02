pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timestamps()
    ansiColor('xterm')
  }

  parameters {
    booleanParam(name: 'RUN_TESTS', defaultValue: true, description: 'lint / test 실행 여부')
    booleanParam(name: 'PUSH_IMAGE', defaultValue: false, description: '도커 레지스트리에 이미지 푸시할까요?')
    booleanParam(name: 'DEPLOY', defaultValue: true, description: '컨테이너를 서버에 배포할까요?')
  }

  environment {
    // === 프로젝트 / 네트워크 명 ===
    APP_NAME        = 'saegim-frontend'      // 컨테이너/이미지 이름 기본
    DOCKER_NETWORK  = 'aicc-net'             // (관리자 제공) 외부 네트워크 - 없으면 실패

    // === 레지스트리 (옵션) ===
    // 예: 'nexus.local:5000' 또는 'ghcr.io/your-org'
    DOCKER_REGISTRY = "${env.CUSTOM_DOCKER_REGISTRY}"

    // === Git ===
    GIT_REPOSITORY_URL = 'https://github.com/aicc6/saegim-frontend.git'
  }

  // NOTE: Webhook 트리거는 Job 설정(“GitHub hook trigger for GITScm polling”)에 맡김
  // triggers { githubPush() }

  stages {

    stage('🛎️ Checkout') {
      steps {
        // Job의 SCM 설정(Branches to build = */develop)에 맞춰 checkout
        checkout scm
        script {
          // Jenkins가 제공하는 브랜치명 감지 (멀티/단일 파이프라인 모두 대응)
          def branch = env.BRANCH_NAME
          if (!branch) {
            branch = sh(script: "git rev-parse --abbrev-ref HEAD", returnStdout: true).trim()
          }
          env.CURRENT_BRANCH = branch

          // 이미지 풀네임 구성 (레지스트리 유무에 따라)
          env.FULL_IMAGE = (env.DOCKER_REGISTRY?.trim())
            ? "${env.DOCKER_REGISTRY}/${env.APP_NAME}"
            : "${env.APP_NAME}"

          echo "✔ Branch        : ${env.CURRENT_BRANCH}"
          echo "✔ FULL_IMAGE    : ${env.FULL_IMAGE}"
        }
      }
    }

    stage('🔐 Inject .env.local') {
      steps {
        // Jenkins Credentials에 Secret file 타입으로 저장된 .env.local 사용 (ID: FRONTEND_ENV_LOCAL)
        withCredentials([file(credentialsId: 'FRONTEND_ENV_LOCAL', variable: 'ENV_FILE')]) {
          sh '''
            set -e
            cp "$ENV_FILE" .env.local
            echo "✅ .env.local injected"
          '''
        }
      }
    }

    stage('🧪 Lint & Test (inside Node container)') {
      when { expression { return params.RUN_TESTS } }
      steps {
        sh '''
          set -e
          docker run --rm -v "$PWD":/app -w /app node:20-alpine sh -lc '
            apk add --no-cache libc6-compat git
            npm ci
            npm run lint --if-present
            npm test --if-present
          '
        '''
      }
    }

    stage('🐳 Docker Build') {
      steps {
        sh '''
          set -e
          test -f .env.local || { echo "❌ .env.local not found in workspace"; exit 1; }

          echo "🔎 .dockerignore에 .env.local이 포함되어 있지 않은지 확인하세요."
          echo "🏗️  Building image: ${FULL_IMAGE}:${BUILD_NUMBER}  and  ${FULL_IMAGE}:${CURRENT_BRANCH}"

          docker build --pull \
            -t ${FULL_IMAGE}:${BUILD_NUMBER} \
            -t ${FULL_IMAGE}:${CURRENT_BRANCH} \
            .
        '''
      }
    }

    stage('📤 Push Docker Image') {
      when { expression { return params.PUSH_IMAGE && (env.DOCKER_REGISTRY?.trim()) } }
      steps {
        withCredentials([usernamePassword(credentialsId: 'DOCKER_REGISTRY_CREDENTIALS', usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
          sh '''
            set -e
            echo "$REG_PASS" | docker login ${DOCKER_REGISTRY} -u "$REG_USER" --password-stdin
            docker push ${FULL_IMAGE}:${BUILD_NUMBER}
            docker push ${FULL_IMAGE}:${CURRENT_BRANCH}
            docker logout ${DOCKER_REGISTRY} || true
          '''
        }
      }
    }

    stage('🚀 Deploy (no host port binding)') {
      when { expression { return params.DEPLOY } }
      steps {
        sh '''
          set -e

          # 1) 필수 네트워크 존재 확인 (공유 서버 안전성)
          if ! docker network inspect ${DOCKER_NETWORK} > /dev/null 2>&1; then
            echo "❌ Required docker network '${DOCKER_NETWORK}' not found."
            echo "   관리자에게 해당 네트워크 연결 요청 후 다시 실행하세요."
            exit 1
          fi

          # 2) 기존 컨테이너 종료/삭제 (graceful)
          if docker ps -a --format '{{.Names}}' | grep -xq '${APP_NAME}'; then
            echo "🧹 Stopping old container '${APP_NAME}' ..."
            docker stop -t 20 ${APP_NAME} || true
            docker rm ${APP_NAME} || true
          fi

          # 3) 새 컨테이너 실행 (포트 바인딩 금지, NPM 라우팅 전제)
          echo "🏁 Running container '${APP_NAME}' from image '${FULL_IMAGE}:${CURRENT_BRANCH}'"
          docker run -d \
            --name ${APP_NAME} \
            --restart unless-stopped \
            --network ${DOCKER_NETWORK} \
            --expose 3000 \
            --label app=${APP_NAME} \
            --label branch=${CURRENT_BRANCH} \
            ${FULL_IMAGE}:${CURRENT_BRANCH}

          # 4) 헬스체크 대기 (Dockerfile의 HEALTHCHECK 전제)
          echo "⏳ Waiting for container to be healthy ..."
          for i in $(seq 1 20); do
            STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' ${APP_NAME})
            echo "  - health: $STATUS"
            if [ "$STATUS" = "healthy" ]; then
              echo "✅ Container is healthy."
              exit 0
            fi
            sleep 5
          done

          echo "⚠️  Healthcheck not healthy within timeout. Check logs:"
          docker logs --since=2m ${APP_NAME} || true
          exit 1
        '''
      }
    }
  }

  post {
    always {
      echo '🧹 Cleanup workspace only (no system prune)'
      cleanWs()
    }
  }
}
