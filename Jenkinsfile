pipeline {
  agent any

  parameters {
    choice(
      name: 'BRANCH_TO_BUILD',
      choices: ['main', 'develop', 'release/latest'],
      description: '빌드할 브랜치 선택 (Webhook 시 자동)'
    )
    booleanParam(
      name: 'RUN_TESTS',
      defaultValue: true,
      description: 'npm test --if-present 실행 여부'
    )
  }

  triggers { githubPush() }

  environment {
    // 깃 저장소
    GIT_REPOSITORY_URL = 'https://github.com/aicc6/saegim-frontend.git'

    // 레지스트리/크리덴셜은 전역 환경변수(CUSTOM_*)에서 읽음
    DOCKER_REGISTRY    = "${env.CUSTOM_DOCKER_REGISTRY}"      // ex) nexus.aicc-project.com:5080
    DOCKER_CREDENTIALS = "${env.CUSTOM_DOCKER_CREDENTIALS}"   // ex) jd (Credentials ID)
    DOCKER_IMAGE       = 'aicc/saegim-frontend'

    // 내부 네트워크명(외부 포트 바인딩 금지, NPM 라우팅)
    DOCKER_NETWORK = 'aicc-net'
    BASE_CONTAINER = 'saegim-frontend'

    // 앱 런타임
    NODE_ENV = 'production'
    APP_PORT = '3000'
  }

  options {
    buildDiscarder(logRotator(numToKeepStr: '10', daysToKeepStr: '30'))
    timeout(time: 45, unit: 'MINUTES')
    disableConcurrentBuilds()
    timestamps()
  }

  stages {

    stage('🔄 Clone & Prepare env') {
      steps {
        script {
          env.TARGET_BRANCH = (params.BRANCH_TO_BUILD ?: env.BRANCH_NAME ?: 'develop')
            .replace('refs/heads/','').replace('origin/','')
          echo "🔍 branch: ${env.TARGET_BRANCH}"
        }

        git branch: "${env.TARGET_BRANCH}", url: "${env.GIT_REPOSITORY_URL}"

        script {
          env.GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
          echo "🔖 commit: ${env.GIT_COMMIT_SHORT}"
        }

        // .env.local 주입 (Secret file: ID = saegim-frontend)
        withCredentials([file(credentialsId: 'saegim-frontend', variable: 'ENV_FILE')]) {
          sh '''
            set -e
            echo "📄 inject .env.local"
            cp "$ENV_FILE" ./.env.local
            chmod 600 ./.env.local || true
            ls -al | sed -n '1,80p'
          '''
        }
      }
    }

    stage('✅ Optional Tests') {
      when { expression { return params.RUN_TESTS } }
      steps {
        script {
          docker.image('node:20-alpine').inside {
            sh '''
              set -e
              npm ci
              npm run lint --if-present
              npm test --if-present
            '''
          }
        }
      }
    }

    stage('🐳 Build Docker Image') {
      steps {
        script {
          // 레지스트리 접두어 포함한 풀네임 구성
          env.FULL_IMAGE = (env.DOCKER_REGISTRY ? "${env.DOCKER_REGISTRY}/" : "") + "${env.DOCKER_IMAGE}"
          echo "🐳 build: ${env.FULL_IMAGE}:${BUILD_NUMBER}"

          // Dockerfile 루트 기준, 빌드 인자 전달
          docker.build(
            "${env.FULL_IMAGE}:${BUILD_NUMBER}",
            "--build-arg NODE_ENV=${NODE_ENV} --build-arg APP_PORT=${APP_PORT} ."
          )
          env.DOCKER_BUILD_SUCCESS = 'true'
        }
      }
    }

    stage('📤 Push Docker Image') {
      when { environment name: 'DOCKER_BUILD_SUCCESS', value: 'true' }
      steps {
        script {
          if (env.DOCKER_REGISTRY && env.DOCKER_REGISTRY != 'localhost' && env.DOCKER_REGISTRY != 'local') {
            // 5080 같은 포트면 HTTP, 443이면 HTTPS로 자동판단
            def proto = (env.DOCKER_REGISTRY ==~ /.*:443$/) ? "https" : "http"
            docker.withRegistry("${proto}://${DOCKER_REGISTRY}", "${DOCKER_CREDENTIALS}") {
              def img = docker.image("${env.FULL_IMAGE}:${BUILD_NUMBER}")
              img.push("${BUILD_NUMBER}")

              // main이면 latest도 푸시
              if (env.TARGET_BRANCH == 'main') {
                sh "docker tag ${env.FULL_IMAGE}:${BUILD_NUMBER} ${env.FULL_IMAGE}:latest"
                img.push("latest")
                echo "✅ pushed latest"
              }
            }
            echo "✅ pushed: ${env.FULL_IMAGE}:${BUILD_NUMBER}"
          } else {
            echo "ℹ️ no remote registry; push skipped"
          }
          env.DOCKER_PUSH_SUCCESS = 'true'
        }
      }
    }

    stage('🚀 Deploy') {
      when { environment name: 'DOCKER_PUSH_SUCCESS', value: 'true' }
      steps {
        script {
          def deployEnv     = (env.TARGET_BRANCH == 'main') ? 'production' : 'development'
          def containerName = "${env.BASE_CONTAINER}-${deployEnv}"
          def imageRef      = "${env.FULL_IMAGE}:${BUILD_NUMBER}"

          echo """
          ▶ Deploy
             - branch   : ${env.TARGET_BRANCH}
             - env      : ${deployEnv}
             - network  : ${env.DOCKER_NETWORK}
             - container: ${containerName}
             - image    : ${imageRef}
          """

          sh """
            set -e

            # 내부 네트워크 준비
            if ! docker network ls | grep -q ${DOCKER_NETWORK}; then
              docker network create ${DOCKER_NETWORK} || true
            fi

            # 원격 레지스트리 사용 시 이미지 pull (로컬 빌드만 쓰면 생략 가능)
            if [ -n "${DOCKER_REGISTRY}" ] && [ "${DOCKER_REGISTRY}" != "localhost" ] && [ "${DOCKER_REGISTRY}" != "local" ]; then
              docker pull ${imageRef} || true
            fi

            # 기존 컨테이너 제거
            docker rm -f ${containerName} 2>/dev/null || true

            # 안전 옵션(공유 서버) + 외부 포트 바인딩 금지
            docker run -d \\
              --name ${containerName} \\
              --network ${DOCKER_NETWORK} \\
              --restart unless-stopped \\
              --label "app=saegim-frontend" \\
              -e NODE_ENV=${NODE_ENV} \\
              -e PORT=${APP_PORT} \\
              --cpus="1" \\
              --memory="512m" \\
              --pids-limit=256 \\
              --read-only \\
              --tmpfs /tmp:rw,size=64m \\
              --security-opt no-new-privileges \\
              --cap-drop ALL \\
              --health-cmd="curl -fsS http://localhost:${APP_PORT}/ || exit 1" \\
              --health-interval=30s \\
              --health-timeout=10s \\
              --health-retries=3 \\
              ${imageRef}

            docker image prune -f || true
          """
        }
      }
    }
  }

  post {
    always {
      echo "🧹 cleanup"
      sh 'docker system prune -f || true'
      cleanWs()
    }
    success {
      script {
        def envName = (env.TARGET_BRANCH == 'main') ? 'production' : 'development'
        echo "✅ done: ${envName}"
        echo "📦 ${env.FULL_IMAGE}:${env.BUILD_NUMBER}"
        echo "🔖 ${env.GIT_COMMIT_SHORT}"
      }
    }
    failure {
      echo '❌ pipeline failed'
      sh '''
        echo "🔍 snapshot"
        docker ps -a | grep saegim-frontend || true
        docker images | grep saegim-frontend || true
      '''
    }
  }
}
