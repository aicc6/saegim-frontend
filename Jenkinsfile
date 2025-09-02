pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timestamps()
    // ansiColor('xterm') 제거 (플러그인 없을 때 오류 방지)
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
    APP_NAME        = 'saegim-frontend'
    DOCKER_NETWORK  = 'aicc-net'
    DOCKER_REGISTRY = "${env.CUSTOM_DOCKER_REGISTRY}"
    GIT_REPOSITORY_URL = 'https://github.com/aicc6/saegim-frontend.git'
  }

  triggers {
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
          env.FULL_IMAGE = (env.DOCKER_REGISTRY?.trim())
            ? "${env.DOCKER_REGISTRY}/${env.APP_NAME}"
            : "${env.APP_NAME}"
          echo "FULL_IMAGE = ${env.FULL_IMAGE}"
        }
      }
    }

    stage('🔐 Inject .env.local') {
      steps {
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

          if ! docker network inspect ${DOCKER_NETWORK} > /dev/null 2>&1; then
            echo "❌ Required docker network '${DOCKER_NETWORK}' not found."
            echo "   관리자에게 해당 네트워크 연결 요청 후 다시 실행하세요."
            exit 1
          fi

          if docker ps -a --format '{{.Names}}' | grep -xq '${APP_NAME}'; then
            echo "🧹 Stopping old container '${APP_NAME}' ..."
            docker stop -t 20 ${APP_NAME} || true
            docker rm ${APP_NAME} || true
          fi

          echo "🏁 Running container '${APP_NAME}' from image '${FULL_IMAGE}:${BRANCH_TO_BUILD}'"
          docker run -d \
            --name ${APP_NAME} \
            --restart unless-stopped \
            --network ${DOCKER_NETWORK} \
            --expose 3000 \
            --label app=${APP_NAME} \
            --label branch=${BRANCH_TO_BUILD} \
            ${FULL_IMAGE}:${BRANCH_TO_BUILD}

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
