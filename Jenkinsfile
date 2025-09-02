pipeline {
  agent any

  /* ===== 공통 옵션 ===== */
  options {
    // 중복 체크아웃 방지 (SCM 단계는 명시적으로 수행)
    skipDefaultCheckout(true)
    // 콘솔 타임스탬프
    timestamps()
    // 빌드 로그 크기 제한(필요시)
    buildDiscarder(logRotator(numToKeepStr: '30'))
    // 작업중단시 이전 빌드 종료
    disableConcurrentBuilds()
  }

  /* ===== 수동 파라미터 ===== */
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

  /* ===== 트리거 ===== */
  triggers {
    // GitHub Webhook
    githubPush()
  }

  /* ===== 환경 변수 ===== */
  environment {
    // 레지스트리/크리덴셜은 전역/Job에 정의돼 있으면 우선 사용
    DOCKER_REGISTRY    = "${env.DOCKER_REGISTRY ?: env.CUSTOM_DOCKER_REGISTRY}"
    DOCKER_CREDENTIALS = "${env.DOCKER_CREDENTIALS ?: env.CUSTOM_DOCKER_CREDENTIALS}"

    // 이미지 네임(레지스트리 앞을 제외한 path)
    DOCKER_IMAGE_PATH  = "aicc/saegim-frontend"

    // Git
    GIT_URL            = "https://github.com/aicc6/saegim-frontend.git"
  }

  stages {

    /* ===== 브랜치 결정(웹훅/수동 모두 커버) ===== */
    stage('Resolve Branch') {
      steps {
        script {
          // Webhook이면 env.CHANGE_BRANCH, env.BRANCH_NAME, env.GIT_BRANCH 등에서 추론
          def ref = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: "").trim()
          def fromWebhook = ""
          if (ref) {
            fromWebhook = ref.replaceAll(/^origin\//, '')
          } else {
            // 멀티브랜치가 아닌 단일 Job 환경에서 changeLogSets를 통해 추론 시도
            try {
              def sets = currentBuild.rawBuild.getChangeSets()
              if (sets && sets.size() > 0) {
                def entries = sets[0].items
                if (entries && entries.size() > 0) {
                  // 가장 최근 entry의 브랜치 참조 추출 시도(없을 수 있음)
                  fromWebhook = params.BRANCH_TO_BUILD ?: 'develop'
                }
              }
            } catch (ignored) {
              fromWebhook = params.BRANCH_TO_BUILD ?: 'develop'
            }
          }
          env.EFFECTIVE_BRANCH = (fromWebhook ?: (params.BRANCH_TO_BUILD ?: 'develop')).trim()
          echo "Using branch: ${env.EFFECTIVE_BRANCH}"
        }
      }
    }

    /* ===== 체크아웃 ===== */
    stage('Checkout') {
      steps {
        checkout([$class: 'GitSCM',
          branches: [[name: "*/${env.EFFECTIVE_BRANCH}"]],
          userRemoteConfigs: [[url: "${env.GIT_URL}"]],
          doGenerateSubmoduleConfigurations: false,
          extensions: [
            [$class: 'CloneOption', noTags: false, shallow: true, depth: 10, reference: '', timeout: 15]
          ]
        ])
        script {
          // 커밋 SHA/짧은 SHA
          env.GIT_COMMIT_SHA = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
          env.GIT_SHORT_SHA  = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        }
      }
    }

    /* ===== 환경 표시 ===== */
    stage('Show Env') {
      steps {
        sh '''
          echo "=== Effective Variables ==="
          echo DOCKER_REGISTRY=${DOCKER_REGISTRY}
          echo DOCKER_CREDENTIALS=${DOCKER_CREDENTIALS}
          echo DOCKER_IMAGE_PATH=${DOCKER_IMAGE_PATH}
          echo EFFECTIVE_BRANCH=${EFFECTIVE_BRANCH}
          echo BUILD_NUMBER=${BUILD_NUMBER}
          echo GIT_COMMIT_SHA=${GIT_COMMIT_SHA}
          echo GIT_SHORT_SHA=${GIT_SHORT_SHA}
        '''
      }
    }

    /* ===== (옵션) 레지스트리 로그인 ===== */
    stage('Nexus Login') {
      when { expression { return env.DOCKER_REGISTRY?.trim() && env.DOCKER_CREDENTIALS?.trim() } }
      steps {
        withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS}", passwordVariable: 'REG_PASS', usernameVariable: 'REG_USER')]) {
          sh '''
            set -e
            echo "Login to ${DOCKER_REGISTRY}"
            echo "$REG_PASS" | docker login ${DOCKER_REGISTRY} -u ${REG_USER} --password-stdin
          '''
        }
      }
    }

    /* ===== Secret file → ./frontend/.env.local 준비 ===== */
    stage('Prepare .env.local') {
      steps {
        withCredentials([file(credentialsId: 'saegim-frontend', variable: 'ENVFILE')]) { // ← 실제 credentialsId 확인
          sh '''
            set -e
            test -d ./frontend || { echo "[ERROR] ./frontend 디렉터리가 없습니다."; exit 2; }

            # Secret file을 빌드 컨텍스트에 복사
            cp "$ENVFILE" ./frontend/.env.local
            echo "[INFO] .env.local copied to ./frontend/.env.local"

            # 핵심 키 최소 검증
            grep -E '^NEXT_PUBLIC_API_BASE_URL=' ./frontend/.env.local >/dev/null \
              || { echo "[ERROR] NEXT_PUBLIC_API_BASE_URL missing in .env.local"; exit 2; }

            # 빌드 컨텍스트에 실제로 존재하는지 확인
            ls -al ./frontend/.env.local

            # .dockerignore에 .env.local 이 제외되어 있으면 경고 (제외되어 있으면 빌드 컨텍스트에서 빠짐)
            if grep -E '^\\s*\\.env\\.local\\s*$' ./frontend/.dockerignore >/dev/null 2>&1; then
              echo "[WARN] ./frontend/.dockerignore 에 .env.local 이 제외되어 있습니다. 이미지에 포함되지 않을 수 있습니다."
            fi
          '''
        }
      }
    }

    /* ===== (옵션) 테스트 ===== */
    stage('Test (optional)') {
      when { expression { return params.RUN_TESTS } }
      steps {
        sh '''
          set -e
          cd ./frontend
          if [ -f package.json ]; then
            echo "[INFO] Running npm ci & npm test --if-present"
            npm ci
            npm test --if-present
          else
            echo "[INFO] No package.json under ./frontend, skip tests."
          fi
        '''
      }
    }

    /* ===== Docker Build & Push ===== */
    stage('Docker Build & Push') {
      steps {
        script {
          // 브랜치 기반 태그
          def branchSafe = env.EFFECTIVE_BRANCH.replaceAll(/[^a-zA-Z0-9._-]/, '-').toLowerCase()
          env.IMAGE_BASE = (env.DOCKER_REGISTRY?.trim() ? "${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE_PATH}" : "${env.DOCKER_IMAGE_PATH}")

          env.TAG_BUILD   = "${env.IMAGE_BASE}:${env.BUILD_NUMBER}"
          env.TAG_SHA     = "${env.IMAGE_BASE}:${env.GIT_SHORT_SHA}"
          env.TAG_BRANCH  = "${env.IMAGE_BASE}:${branchSafe}-latest"
          env.TAG_LATEST  = (branchSafe == 'main' ? "${env.IMAGE_BASE}:latest" : "")

          echo "Build Tags:"
          echo " - ${env.TAG_BUILD}"
          echo " - ${env.TAG_SHA}"
          echo " - ${env.TAG_BRANCH}"
          if (env.TAG_LATEST) { echo " - ${env.TAG_LATEST}" }
        }

        // 빌드(컨텍스트: ./frontend)
        sh '''
          set -e
          docker build \
            -f ./frontend/Dockerfile \
            -t "${TAG_BUILD}" \
            -t "${TAG_SHA}" \
            -t "${TAG_BRANCH}" \
            ./frontend

          if [ -n "${TAG_LATEST}" ]; then
            docker tag "${TAG_BUILD}" "${TAG_LATEST}"
          fi
        '''

        // 푸시
        sh '''
          set -e
          docker push "${TAG_BUILD}"
          docker push "${TAG_SHA}"
          docker push "${TAG_BRANCH}"
          if [ -n "${TAG_LATEST}" ]; then
            docker push "${TAG_LATEST}"
          fi
        '''
      }
    }
  }

  /* ===== 사후 처리 ===== */
  post {
    success {
      echo "✅ 성공 — 이미지 푸시 완료"
      sh '''
        echo "Pushed:"
        echo " - ${TAG_BUILD}"
        echo " - ${TAG_SHA}"
        echo " - ${TAG_BRANCH}"
        if [ -n "${TAG_LATEST}" ]; then
          echo " - ${TAG_LATEST}"
        fi
      '''
    }
    failure {
      echo "❌ 실패 — 콘솔 로그에서 .env.local 준비/검증 및 레지스트리 로그인/푸시 단계 확인"
    }
    always {
      // 로컬 빌드 캐시 정리(에이전트 디스크 보호)
      sh 'docker system prune -f || true'
    }
  }
}
