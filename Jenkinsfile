pipeline {
  agent any

  // ===== 공통 옵션 =====
  options {
    skipDefaultCheckout(true)          // SCM 중복 체크아웃 방지
    timestamps()                       // 콘솔 타임스탬프
    buildDiscarder(logRotator(numToKeepStr: '30'))
    disableConcurrentBuilds()          // 동시 빌드 차단
  }

  // ===== 수동 파라미터 =====
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

  // ===== 트리거 =====
  triggers { githubPush() }

  // ===== 환경 변수 =====
  environment {
    DOCKER_REGISTRY    = "${env.DOCKER_REGISTRY ?: env.CUSTOM_DOCKER_REGISTRY}"
    DOCKER_CREDENTIALS = "${env.DOCKER_CREDENTIALS ?: env.CUSTOM_DOCKER_CREDENTIALS}"
    DOCKER_IMAGE_PATH  = "aicc/saegim-frontend"
    GIT_URL            = "https://github.com/aicc6/saegim-frontend.git"
    // Detect Build Context에서 설정됨
    CONTEXT_DIR        = ""
    DOCKERFILE_PATH    = ""
  }

  stages {

    // ===== 브랜치 결정(웹훅/수동) =====
    stage('Resolve Branch') {
      steps {
        script {
          def ref = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: "").trim()
          ref = ref.replaceAll(/^origin\//, '') // origin/* 접두 제거
          env.EFFECTIVE_BRANCH = (ref ?: (params.BRANCH_TO_BUILD ?: 'develop')).trim()
          echo "Using branch: ${env.EFFECTIVE_BRANCH}"
        }
      }
    }

    // ===== 체크아웃 =====
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
          env.GIT_COMMIT_SHA = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
          env.GIT_SHORT_SHA  = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        }
      }
    }

    // ===== 빌드 컨텍스트/도커파일 자동 감지 =====
    stage('Detect Build Context') {
      steps {
        script {
          def hasFrontendDockerfile = sh(script: 'test -f ./frontend/Dockerfile && echo yes || echo no', returnStdout: true).trim() == 'yes'
          def hasRootDockerfile     = sh(script: 'test -f ./Dockerfile && echo yes || echo no',       returnStdout: true).trim() == 'yes'

          if (hasFrontendDockerfile) {
            env.CONTEXT_DIR     = 'frontend'
            env.DOCKERFILE_PATH = 'frontend/Dockerfile'
          } else if (hasRootDockerfile) {
            env.CONTEXT_DIR     = '.'
            env.DOCKERFILE_PATH = 'Dockerfile'
          } else {
            error "[ERROR] Dockerfile 을 찾을 수 없습니다. frontend/Dockerfile 또는 Dockerfile 이 필요합니다."
          }

          echo "Build Context: ${env.CONTEXT_DIR ?: '(unset)'}"
          echo "Dockerfile   : ${env.DOCKERFILE_PATH ?: '(unset)'}"

          if (!env.CONTEXT_DIR?.trim() || !env.DOCKERFILE_PATH?.trim()) {
            error "[ERROR] 빌드 컨텍스트 감지 실패: CONTEXT_DIR=${env.CONTEXT_DIR}, DOCKERFILE_PATH=${env.DOCKERFILE_PATH}"
          }
        }
      }
    }

    // ===== 환경 표시 =====
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
          echo CONTEXT_DIR=${CONTEXT_DIR}
          echo DOCKERFILE_PATH=${DOCKERFILE_PATH}
        '''
      }
    }

    // ===== (옵션) 레지스트리 로그인 =====
    stage('Nexus Login') {
      when { expression { return env.DOCKER_REGISTRY?.trim() && env.DOCKER_CREDENTIALS?.trim() } }
      steps {
        withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS}", passwordVariable: 'REG_PASS', usernameVariable: 'REG_USER')]) {
          sh '''
            set -eu
            echo "Login to ${DOCKER_REGISTRY}"
            echo "$REG_PASS" | docker login "${DOCKER_REGISTRY}" -u "${REG_USER}" --password-stdin
          '''
        }
      }
    }

    // ===== Secret file → ${CONTEXT_DIR}/.env.local 준비 =====
    stage('Prepare .env.local') {
      steps {
        withCredentials([file(credentialsId: 'saegim-frontend', variable: 'ENVFILE')]) { // 실제 credentialsId 확인
          sh '''
            set -eu
            test -d "${CONTEXT_DIR}" || { echo "[ERROR] ${CONTEXT_DIR} 디렉터리가 없습니다."; exit 2; }

            # Secret file을 빌드 컨텍스트에 복사
            cp "$ENVFILE" "${CONTEXT_DIR}/.env.local"
            echo "[INFO] .env.local copied to ${CONTEXT_DIR}/.env.local"

            # 핵심 키 최소 검증
            grep -E '^NEXT_PUBLIC_API_BASE_URL=' "${CONTEXT_DIR}/.env.local" >/dev/null \
              || { echo "[ERROR] NEXT_PUBLIC_API_BASE_URL missing in .env.local"; exit 2; }

            # 실제 존재 확인
            ls -al "${CONTEXT_DIR}/.env.local"

            # .dockerignore에 .env.local 제외 규칙이 있는지 경고
            if [ -f "${CONTEXT_DIR}/.dockerignore" ]; then
              if grep -Eq '(^|[[:space:]])[.]env[.]local([[:space:]]|$)' "${CONTEXT_DIR}/.dockerignore" && \
                 ! grep -Eq '(^|[[:space:]])![[:space:]]*[.]env[.]local([[:space:]]|$)' "${CONTEXT_DIR}/.dockerignore"; then
                echo "[WARN] ${CONTEXT_DIR}/.dockerignore 에 .env.local 제외 규칙이 있어 이미지에 포함되지 않을 수 있습니다."
              fi
            fi
          '''
        }
      }
    }

    // ===== (옵션) 테스트 =====
    stage('Test (optional)') {
      when { expression { return params.RUN_TESTS } }
      steps {
        sh '''
          set -eu
          cd "${CONTEXT_DIR}"
          if [ -f package.json ]; then
            echo "[INFO] Running npm ci & npm test --if-present"
            npm ci
            npm test --if-present
          else
            echo "[INFO] No package.json under ${CONTEXT_DIR}, skip tests."
          fi
        '''
      }
    }

    // ===== Docker Build & Push =====
    stage('Docker Build & Push') {
      steps {
        script {
          if (!env.CONTEXT_DIR?.trim())     { error "[ERROR] CONTEXT_DIR 미설정"; }
          if (!env.DOCKERFILE_PATH?.trim()) { error "[ERROR] DOCKERFILE_PATH 미설정"; }

          def branchSafe = env.EFFECTIVE_BRANCH.replaceAll(/[^a-zA-Z0-9._-]/, '-').toLowerCase()
          env.IMAGE_BASE = (env.DOCKER_REGISTRY?.trim() ? "${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE_PATH}" : "${env.DOCKER_IMAGE_PATH}")

          env.TAG_BUILD  = "${env.IMAGE_BASE}:${env.BUILD_NUMBER}"
          env.TAG_SHA    = "${env.IMAGE_BASE}:${env.GIT_SHORT_SHA}"
          env.TAG_BRANCH = "${env.IMAGE_BASE}:${branchSafe}-latest"
          env.TAG_LATEST = (branchSafe == 'main' ? "${env.IMAGE_BASE}:latest" : "")

          echo "Build Context: ${env.CONTEXT_DIR}"
          echo "Dockerfile   : ${env.DOCKERFILE_PATH}"
          echo "Build Tags:"
          echo " - ${env.TAG_BUILD}"
          echo " - ${env.TAG_SHA}"
          echo " - ${env.TAG_BRANCH}"
          if (env.TAG_LATEST) { echo " - ${env.TAG_LATEST}" }
        }

        // Build (BuildKit on for 성능/캐시)
        withEnv(['DOCKER_BUILDKIT=1']) {
          sh '''
            set -eu
            docker build \
              -f "${DOCKERFILE_PATH}" \
              -t "${TAG_BUILD}" \
              -t "${TAG_SHA}" \
              -t "${TAG_BRANCH}" \
              "${CONTEXT_DIR}"

            if [ -n "${TAG_LATEST}" ]; then
              docker tag "${TAG_BUILD}" "${TAG_LATEST}"
            fi
          '''
        }

        // Push (레지스트리 로그인하지 않아도, public hub일 경우 가능)
        sh '''
          set -eu
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

  // ===== 사후 처리 =====
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
      // 공유 서버 안전: 우리 태그만 정리 (전역 캐시/이미지 건드리지 않음)
      sh '''
        set -e
        if [ -n "${TAG_BUILD}"  ]; then docker rmi -f "${TAG_BUILD}"  2>/dev/null || true; fi
        if [ -n "${TAG_SHA}"    ]; then docker rmi -f "${TAG_SHA}"    2>/dev/null || true; fi
        if [ -n "${TAG_BRANCH}" ]; then docker rmi -f "${TAG_BRANCH}" 2>/dev/null || true; fi
        if [ -n "${TAG_LATEST}" ]; then docker rmi -f "${TAG_LATEST}" 2>/dev/null || true; fi
      '''
      // 전역 prune 명령은 절대 실행하지 않음
    }
  }
}
