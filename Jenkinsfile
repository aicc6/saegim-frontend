pipeline {
  agent any

  parameters {
    choice(name: 'BRANCH_TO_BUILD', choices: ['develop','main','release/latest'], description: '빌드 브랜치')
    booleanParam(name: 'RUN_TESTS', defaultValue: false, description: 'npm test 실행 여부')
  }

  triggers { githubPush() }

  environment {
    // ===== 프론트 전용 =====
    GIT_REPOSITORY_URL = 'https://github.com/aicc6/saegim-frontend.git'

    // Docker 이미지/컨테이너
    DOCKER_IMAGE       = 'aicc/saegim-frontend'
    CONTAINER_NAME     = 'saegim-frontend'

    // 선택(없으면 로컬만 사용)
    DOCKER_REGISTRY    = "${env.CUSTOM_DOCKER_REGISTRY}"      // 예: nexus.example.com
    DOCKER_CREDENTIALS = "${env.CUSTOM_DOCKER_CREDENTIALS}"   // Jenkins Credentials ID

    // 런타임/빌드 공용 .env 파일 (Jenkins의 "Secret file")
    FRONT_ENV_FILE_CRED_ID = 'saegim-frontend' // ← 현재 자격증명 ID와 정확히 일치
  }

  options {
    buildDiscarder(logRotator(numToKeepStr: '10', daysToKeepStr: '30'))
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
    timestamps()
  }

  stages {

    stage('Checkout') {
      steps {
        script {
          def branchName = params.BRANCH_TO_BUILD ?: (env.BRANCH_NAME ?: 'develop')
          branchName = branchName.replace('refs/heads/','').replace('origin/','')
          echo "🔍 브랜치: ${branchName}"

          checkout([$class: 'GitSCM',
            branches: [[name: "*/${branchName}"]],
            userRemoteConfigs: [[url: env.GIT_REPOSITORY_URL]]
          ])

          env.GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
          echo "✅ commit: ${env.GIT_COMMIT_SHORT}"
        }
      }
    }

    stage('Prepare runtime env (.env.runtime)') {
      steps {
        script {
          try {
            // Secret file → .env.runtime
            withCredentials([file(credentialsId: env.FRONT_ENV_FILE_CRED_ID, variable: 'ENV_FILE')]) {
              sh '''
                cp "$ENV_FILE" .env.runtime
                chmod 600 .env.runtime
                echo "[OK] .env.runtime prepared"
                # 민감정보 노출 위험이 있으니 주석 해두고 정말 필요할 때만 활성화
                # echo "[DEBUG] .env.runtime head:" && head -n 5 .env.runtime || true
              '''
            }
          } catch (e) {
            echo "⚠️ Jenkins에 FRONT_ENV_FILE_CRED_ID(${env.FRONT_ENV_FILE_CRED_ID}) 없음 → 빈 파일로 진행"
            sh 'touch .env.runtime && chmod 600 .env.runtime'
          }
        }
      }
    }

    stage('Docker Build') {
      steps {
        script {
          echo "🐳 building ${DOCKER_IMAGE}:${BUILD_NUMBER}"
          sh '''
            set -e

            # .env.runtime 로드 (NEXT_PUBLIC_* / GOOGLE_REDIRECT_URI 등만 포함되어야 함)
            set -a
            . ./.env.runtime || true
            set +a

            # 필수값 검증(없으면 즉시 실패시켜 원인 명확화)
            : "${NEXT_PUBLIC_API_BASE_URL:?NEXT_PUBLIC_API_BASE_URL is required}"

            # BuildKit 사용 권장 (속도/캐시 향상)
            export DOCKER_BUILDKIT=1

            docker build -t "${DOCKER_IMAGE}:${BUILD_NUMBER}" \
              --label app=saegim-frontend \
              --build-arg NEXT_PUBLIC_API_BASE_URL="$NEXT_PUBLIC_API_BASE_URL" \
              --build-arg GOOGLE_REDIRECT_URI="$GOOGLE_REDIRECT_URI" \
              --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="$NEXT_PUBLIC_FIREBASE_API_KEY" \
              --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" \
              --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="$NEXT_PUBLIC_FIREBASE_PROJECT_ID" \
              --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" \
              --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" \
              --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="$NEXT_PUBLIC_FIREBASE_APP_ID" \
              --build-arg NEXT_PUBLIC_FIREBASE_VAPID_KEY="$NEXT_PUBLIC_FIREBASE_VAPID_KEY" \
              .
          '''
          env.DOCKER_BUILD_SUCCESS = 'true'
        }
      }
    }

    stage('Push Image (optional)') {
      when { environment name: 'DOCKER_BUILD_SUCCESS', value: 'true' }
      steps {
        script {
          if (env.DOCKER_REGISTRY && env.DOCKER_REGISTRY != 'localhost' && env.DOCKER_REGISTRY != 'local') {
            docker.withRegistry("https://${DOCKER_REGISTRY}", "${DOCKER_CREDENTIALS}") {
              def img = docker.image("${DOCKER_IMAGE}:${BUILD_NUMBER}")
              img.push("${BUILD_NUMBER}")
              if ((env.BRANCH_NAME ?: '').contains('main') || params.BRANCH_TO_BUILD == 'main') {
                img.push('latest')
              }
            }
            echo "✅ pushed: ${DOCKER_IMAGE}:${BUILD_NUMBER}"
          } else {
            echo "ℹ️ 레지스트리 미설정 → 로컬 이미지 사용"
          }
          env.DOCKER_PUSH_SUCCESS = 'true'
        }
      }
    }

    stage('Deploy (safe on this agent)') {
      when { environment name: 'DOCKER_PUSH_SUCCESS', value: 'true' }
      steps {
        script {
          def branch = params.BRANCH_TO_BUILD ?: (env.BRANCH_NAME ?: 'develop')
          def envName = branch.contains('main') ? 'production' : 'development'
          def cname   = "${CONTAINER_NAME}-${envName}"
          def net     = 'saegim-net'

          sh """
            set -e

            # 네트워크 준비(없으면 생성)
            if ! docker network ls | grep -q ${net}; then
              docker network create ${net} || true
            fi

            # 원격 레지스트리 사용 중이면 pull
            if [ -n "${DOCKER_REGISTRY}" ] && [ "${DOCKER_REGISTRY}" != "localhost" ] && [ "${DOCKER_REGISTRY}" != "local" ]; then
              docker pull ${DOCKER_IMAGE}:${BUILD_NUMBER}
            fi

            # 기존 동일 컨테이너만 안전 교체
            docker stop ${cname} || true
            docker rm   ${cname} || true

            # 포트 바인딩 없음(공유 서버 규칙). NPM이 컨테이너명:3000으로 라우팅.
            docker run -d \\
              --name ${cname} \\
              --network ${net} \\
              --restart unless-stopped \\
              --label app=saegim-frontend \\
              --env-file ./.env.runtime \\
              ${DOCKER_IMAGE}:${BUILD_NUMBER}

            # 라벨 한정 이미지 정리(전역 prune 금지)
            docker image prune --filter "label=app=saegim-frontend" -f || true

            echo "[OK] Deployed ${cname} with ${DOCKER_IMAGE}:${BUILD_NUMBER}"
          """
        }
      }
    }
  }

  post {
    always {
      sh 'rm -f .env.runtime || true'
      cleanWs()
    }
    success {
      echo "✅ Deployed ${DOCKER_IMAGE}:${BUILD_NUMBER} (commit ${env.GIT_COMMIT_SHORT})"
    }
    failure {
      echo '❌ Build/Deploy failed'
      sh 'docker ps -a | grep saegim-frontend || true'
    }
  }
}
