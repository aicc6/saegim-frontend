pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '30'))
    disableConcurrentBuilds()
    timeout(time: 45, unit: 'MINUTES')
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

  // GitHub Webhook
  triggers { githubPush() }

  environment {
    // Git
    GIT_REPOSITORY_URL = 'https://github.com/aicc6/saegim-frontend.git'

    // Registry (없으면 로컬만 사용)
    DOCKER_REGISTRY    = "${env.DOCKER_REGISTRY ?: env.CUSTOM_DOCKER_REGISTRY}"   // 예: nexus-docker.aicc-project.com
    DOCKER_CREDENTIALS = "${env.DOCKER_CREDENTIALS ?: env.CUSTOM_DOCKER_CREDENTIALS}"

    // Image / Container (네임스페이스 포함 경로로 고정)
    IMAGE_NAME     = 'aicc/saegim-frontend'
    DOCKER_IMAGE   = "${DOCKER_REGISTRY ? DOCKER_REGISTRY + '/' : ''}${IMAGE_NAME}"
    CONTAINER_BASE = 'saegim-frontend'

    // Network (내부 라우팅 전용)
    DOCKER_NETWORK = 'saegim-net'

    // App
    APP_ENV = 'production'
  }

  stages {

    stage('Resolve Branch') {
      steps {
        script {
          // Webhook 우선 → 수동 파라미터 → 기본 develop
          def b = env.GIT_BRANCH ?: env.BRANCH_NAME ?: env.CHANGE_BRANCH ?: params.BRANCH_TO_BUILD ?: 'develop'
          b = b.replaceFirst(/^refs\/heads\//, '').replaceFirst(/^origin\//, '')
          env.TARGET_BRANCH = b
          echo "Using branch: ${env.TARGET_BRANCH}"
        }
      }
    }

    stage('Checkout') {
      steps {
        checkout([$class: 'GitSCM',
          branches: [[name: "*/${env.TARGET_BRANCH}"]],
          userRemoteConfigs: [[url: "${env.GIT_REPOSITORY_URL}"]],
          extensions: [[$class: 'CloneOption', depth: 10, shallow: true, noTags: false]]
        ])
        script {
          env.GIT_SHORT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        }
      }
    }

    stage('Detect Build Context') {
      steps {
        script {
          env.CONTEXT_DIR = '.'
          env.DOCKERFILE_PATH = 'Dockerfile'
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
          echo "DOCKER_IMAGE=${DOCKER_IMAGE}"
          echo "GIT_SHORT_SHA=${GIT_SHORT_SHA}"
          echo "BUILD_NUMBER=${BUILD_NUMBER}"
        '''
      }
    }

    stage('Prepare .env.local (frontend)') {
      steps {
        script {
          // Jenkins Credentials에 Secret file로 등록: ID = "saegim-frontend"
          def ENV_FILE_ID = 'saegim-frontend'

          withCredentials([file(credentialsId: ENV_FILE_ID, variable: 'ENV_FILE')]) {
            sh '''
              set -e
              cp "$ENV_FILE" .env.local
              chmod 640 .env.local

              # 메타 정보 주입
              {
                echo "BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
                echo "GIT_COMMIT=${GIT_SHORT_SHA}"
              } >> .env.local

              # .dockerignore 가 .env* 를 무시하더라도 .env.local 만은 포함되도록 안전장치
              if [ -f .dockerignore ]; then
                if ! grep -qE '^!\\.env\\.local$' .dockerignore; then
                  echo '!/.env.local' >> .dockerignore
                fi
              fi
            '''
          }
        }
      }
    }

    stage('Validate required envs') {
      steps {
        sh '''
          set -e
          # 필수 키 확인 (빌드 타임 문제 재발 방지)
          for k in NEXT_PUBLIC_API_BASE_URL GOOGLE_REDIRECT_URI NEXT_PUBLIC_FIREBASE_API_KEY NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN NEXT_PUBLIC_FIREBASE_PROJECT_ID NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID NEXT_PUBLIC_FIREBASE_APP_ID NEXT_PUBLIC_FIREBASE_VAPID_KEY; do
            if ! grep -qE "^${k}=" .env.local; then
              echo "[ERROR] .env.local에 ${k} 가 없습니다."
              exit 1
            fi
          done
          echo "[OK] .env.local 필수 키 존재 확인"
        '''
      }
    }

    stage('Nexus Login') {
      when { expression { return env.DOCKER_REGISTRY && env.DOCKER_CREDENTIALS } }
      steps {
        withCredentials([usernamePassword(credentialsId: "${env.DOCKER_CREDENTIALS}", passwordVariable: 'REGISTRY_CREDS_PSW', usernameVariable: 'REGISTRY_CREDS_USR')]) {
          sh '''
            echo "$REGISTRY_CREDS_PSW" | docker login "${DOCKER_REGISTRY}" -u "${REGISTRY_CREDS_USR}" --password-stdin
            docker info
          '''
        }
      }
    }

    stage('Test (optional)') {
      when { expression { return params.RUN_TESTS == true } }
      steps {
        sh '''
          set -e
          if [ -f package.json ]; then
            npm ci || true
            npm test --if-present || true
          fi
        '''
      }
    }

    stage('Docker Build & Push (normalized tagging)') {
      steps {
        script {
          // 태깅 규칙: 커밋 해시 + 빌드 번호(+ main이면 latest 추가)
          def isMain   = (env.TARGET_BRANCH == 'main')
          def TAG_SHA  = env.GIT_SHORT_SHA
          def TAG_NUM  = env.BUILD_NUMBER
          def TAG_BR   = env.TARGET_BRANCH.replaceAll(/[^a-zA-Z0-9._-]/, '-')

          sh """
            set -e

            echo "Starting Docker build with normalized tags..."

            # .env.local 로드 (POSIX 표준: set -a)
            set -a
            . ./.env.local
            set +a

            : "\${NEXT_PUBLIC_API_BASE_URL:?NEXT_PUBLIC_API_BASE_URL is required}"
            : "\${GOOGLE_REDIRECT_URI:?GOOGLE_REDIRECT_URI is required}"
            : "\${NEXT_PUBLIC_FIREBASE_API_KEY:?NEXT_PUBLIC_FIREBASE_API_KEY is required}"
            : "\${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:?NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required}"
            : "\${NEXT_PUBLIC_FIREBASE_PROJECT_ID:?NEXT_PUBLIC_FIREBASE_PROJECT_ID is required}"
            : "\${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:?NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is required}"
            : "\${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:?NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is required}"
            : "\${NEXT_PUBLIC_FIREBASE_APP_ID:?NEXT_PUBLIC_FIREBASE_APP_ID is required}"
            : "\${NEXT_PUBLIC_FIREBASE_VAPID_KEY:?NEXT_PUBLIC_FIREBASE_VAPID_KEY is required}"

            docker build -f "${DOCKERFILE_PATH}" \
              --build-arg NEXT_PUBLIC_API_BASE_URL="\${NEXT_PUBLIC_API_BASE_URL}" \
              --build-arg GOOGLE_REDIRECT_URI="\${GOOGLE_REDIRECT_URI}" \
              --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="\${NEXT_PUBLIC_FIREBASE_API_KEY}" \
              --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="\${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}" \
              --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="\${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
              --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="\${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}" \
              --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="\${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}" \
              --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="\${NEXT_PUBLIC_FIREBASE_APP_ID}" \
              --build-arg NEXT_PUBLIC_FIREBASE_VAPID_KEY="\${NEXT_PUBLIC_FIREBASE_VAPID_KEY}" \
              -t "${DOCKER_IMAGE}:${TAG_SHA}" \
              -t "${DOCKER_IMAGE}:${TAG_NUM}" \
              "${CONTEXT_DIR}"
          """

          if (env.DOCKER_REGISTRY && env.DOCKER_CREDENTIALS) {
            sh """ docker push "${DOCKER_IMAGE}:${TAG_SHA}" """
            sh """ docker push "${DOCKER_IMAGE}:${TAG_NUM}" """

            if (isMain) {
              sh """
                docker tag  "${DOCKER_IMAGE}:${TAG_SHA}" "${DOCKER_IMAGE}:latest"
                docker push "${DOCKER_IMAGE}:latest"
              """
            } else {
              // 브랜치 태그는 선택적 유지 (원하면 주석 처리)
              sh """
                docker tag  "${DOCKER_IMAGE}:${TAG_SHA}" "${DOCKER_IMAGE}:${TAG_BR}"
                docker push "${DOCKER_IMAGE}:${TAG_BR}"
              """
            }
          } else {
            echo "No registry configured — using local image only."
          }

          // 이후 배포는 순번 태그를 우선 사용
          env.IMAGE_TAG_FOR_DEPLOY = TAG_NUM
        }
      }
    }

    stage('CD: Deploy to local Docker (no host port, saegim-net)') {
      steps {
        script {
          def isMain = (env.TARGET_BRANCH == 'main')
          def deployEnv = isMain ? 'production' : 'development'
          def containerName = "${env.CONTAINER_BASE}-${deployEnv}"
          def imageRef = "${env.DOCKER_IMAGE}:${env.IMAGE_TAG_FOR_DEPLOY}"

          sh """
            set -e

            echo "== Ensure docker network =="
            if ! docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1; then
              docker network create "$DOCKER_NETWORK"
            fi

            echo "== Pull if registry is configured =="
            if [ -n "${DOCKER_REGISTRY}" ] && [ -n "${DOCKER_CREDENTIALS}" ]; then
              docker pull "${imageRef}" || true
            fi

            echo "== Stop & Remove previous container =="
            docker stop "${containerName}" || true
            docker rm   "${containerName}" || true

            echo "== Run new container (NO host port), network: $DOCKER_NETWORK =="
            docker run -d \
              --name "${containerName}" \
              --network "${DOCKER_NETWORK}" \
              --restart unless-stopped \
              --label "app=saegim-frontend" \
              --label "env=${deployEnv}" \
              --label "git_sha=${GIT_SHORT_SHA}" \
              --health-cmd="curl -f http://localhost:3000/ || exit 1" \
              --health-interval=30s \
              --health-timeout=10s \
              --health-retries=3 \
              "${imageRef}"

            echo "== No host port binding by policy (NPM routes by container name) =="
            echo "Example NPM target: http://${containerName}:3000"

            docker image prune -f || true
          """
        }
      }
    }
  }

  post {
    always {
      script {
        if (env.DOCKER_REGISTRY) {
          sh 'docker logout "${DOCKER_REGISTRY}" || true'
        }
      }
    }
    success {
      echo '✅ 성공 — 빌드/푸시/배포 완료 (내부 네트워크 연결, 포트 미개방)'
    }
    failure {
      echo '❌ 실패 — 콘솔 로그를 확인하세요'
      sh '''
        echo "------ docker ps (related) ------"
        docker ps -a | grep saegim-frontend || true
        echo "------ docker images (related) ------"
        docker images | grep saegim-frontend || true
      '''
    }
  }
}
