pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timestamps()
    ansiColor('xterm')
  }

  parameters {
    choice(
      name: 'BRANCH_TO_BUILD',
      choices: ['develop', 'main', 'release/latest'],
      description: '빌드할 브랜치를 선택하세요'
    )
    booleanParam(name: 'RUN_TESTS', defaultValue: true, description: 'lint / test 실행 여부')
    booleanParam(name: 'PUSH_IMAGE', defaultValue: false, description: '도커 레지스트리에 이미지 푸시할까요?')
    booleanParam(name: 'DEPLOY', defaultValue: true, description: '컨테이너를 서버에 배포할까요?')
  }

  environment {
    // === 프로젝트 / 네트워크 명 ===
    APP_NAME        = 'saegim-frontend'      // 컨테이너 이름 및 이미지 repo 기본값으로 사용
    DOCKER_NETWORK  = 'aicc-net'             // (관리자 제공) 외부 네트워크 - 존재하지 않으면 실패

    // === 레지스트리 (옵션) ===
    // 예: 'nexus.local:5000' 또는 'ghcr.io/your-org'
    DOCKER_REGISTRY = "${env.CUSTOM_DOCKER_REGISTRY}"

    // === Git ===
    GIT_REPOSITORY_URL = 'https://github.com/aicc6/saegim-frontend.git'
  }

  triggers {
    // GitHub Webhook이 설정되어 있으면 자동 트리거
    githubPush()
  }

  stages {

    stage('🛎️ Checkout') {
      steps {
        checkout([$class: 'GitSCM',
          branches: [[name: "*/${params.BRANCH_TO_BUILD}"]],
          userRemoteConfigs: [[url: env.GIT_REPOSITORY_URL]]
        ])
        script {
          // 이미지 풀네임 구성 (레지스트리 유무에 따라)
          env.FULL_IMAGE = (env.DOCKER_REGISTRY?.trim())
            ? "${env.DOCKER_REGISTRY}/${env.APP_NAME}"
            : "${env.APP_NAME}"
          echo "FULL_IMAGE = ${env.FULL_IMAGE}"
        }
      }
    }

    stage('🔐 Inject .env.local') {
      steps {
        // Jenkins Credentials에 file 타입으로 저장된 .env.local 사용 권장 (ID: FRONTEND_ENV_LOCAL)
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
          echo "🏗️  Building image: ${FULL_IMAGE}:${BUILD_NUMBER}  and  ${FULL_IMAGE}:${BRANCH_TO_BUILD}"

          docker build --pull \
            -t ${FULL_IMAGE}:${BUILD_NUMBER} \
            -t ${FULL_IMAGE}:${BRANCH_TO_BUILD} \
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
            docker push ${FULL_IMAGE}:${BRANCH_TO_BUILD}
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
          echo "🏁 Running container '${APP_NAME}' from image '${FULL_IMAGE}:${BRANCH_TO_BUILD}'"
          docker run -d \
            --name ${APP_NAME} \
            --restart unless-stopped \
            --network ${DOCKER_NETWORK} \
            --expose 3000 \
            --label app=${APP_NAME} \
            --label branch=${BRANCH_TO_BUILD} \
            ${FULL_IMAGE}:${BRANCH_TO_BUILD}

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
          # 배포 실패로 간주 (원하면 exit 0 으로 완화 가능)
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
