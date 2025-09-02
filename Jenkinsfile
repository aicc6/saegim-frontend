pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '30'))
    disableConcurrentBuilds()
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
    booleanParam(
      name: 'PRUNE_OLD_DANGLING',
      defaultValue: false,
      description: '이 저장소 라벨의 오래된(dangling) 레이어까지 추가 정리(48h 이상)'
    )
  }

  triggers { githubPush() }

  environment {
    // Git
    GIT_REPOSITORY_URL = 'https://github.com/aicc6/saegim-frontend.git'

    // Docker Registry (옵션: Job/Global에서 빈 값이면 Push 스킵)
    DOCKER_REGISTRY = "${env.DOCKER_REGISTRY ?: env.CUSTOM_DOCKER_REGISTRY}"

    // 🔑 Nexus 계정(jd) 크리덴셜 바인딩 (Declarative)
    // => REGISTRY_CREDS_USR / REGISTRY_CREDS_PSW 자동 생성
    REGISTRY_CREDS = credentials('jd')

    // 이미지 네이밍
    IMAGE_NAME = 'saegim-frontend'

    // 이미지/레이어 식별용 레이블 키
    IMAGE_LABEL_SOURCE = 'org.opencontainers.image.source'
    IMAGE_LABEL_OWNER  = 'org.aicc.owner'
  }

  stages {

    stage('Resolve Branch') {
      steps {
        script {
          def ref = env.GIT_BRANCH ?: env.CHANGE_BRANCH ?: env.BRANCH_NAME ?: ''
          def autoBranch = ref ? ref.replaceFirst(/^origin\//, '') : ''
          env.TARGET_BRANCH = autoBranch ? autoBranch : (params.BRANCH_TO_BUILD ?: 'develop')
          echo "Using branch: ${env.TARGET_BRANCH}"
        }
      }
    }

    stage('Checkout') {
      steps {
        checkout([
          $class: 'GitSCM',
          userRemoteConfigs: [[url: "${env.GIT_REPOSITORY_URL}"]],
          branches: [[name: "*/${env.TARGET_BRANCH}"]],
          extensions: [[$class: 'CloneOption', shallow: true, depth: 10, noTags: false]]
        ])

        script {
          env.GIT_SHORT_SHA = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        }
      }
    }

    stage('Detect Build Context') {
      steps {
        script {
          boolean hasFrontend = fileExists('frontend/Dockerfile')
          boolean hasRoot     = fileExists('Dockerfile')

          if (hasFrontend) {
            env.CONTEXT_DIR     = 'frontend'
            env.DOCKERFILE_PATH = 'frontend/Dockerfile'
          } else if (hasRoot) {
            env.CONTEXT_DIR     = '.'
            env.DOCKERFILE_PATH = 'Dockerfile'
          } else {
            error "No Dockerfile found (checked: ./frontend/Dockerfile, ./Dockerfile)"
          }

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
          echo "GIT_SHORT_SHA=${GIT_SHORT_SHA}"
        '''
      }
    }

    stage('Nexus Login') {
      when { expression { return env.DOCKER_REGISTRY?.trim() } }
      steps {
        sh '''
          echo "$REGISTRY_CREDS_PSW" | docker login "${DOCKER_REGISTRY}" \
            -u "$REGISTRY_CREDS_USR" --password-stdin
          docker info
        '''
      }
    }

    stage('Test (optional)') {
      when { expression { return params.RUN_TESTS } }
      steps {
        dir("${env.CONTEXT_DIR}") {
          sh '''
            if [ -f "package.json" ]; then
              npm ci || npm install
              npm test --if-present
            else
              echo "No package.json — skipping tests"
            fi
          '''
        }
      }
    }

    stage('Docker Build & Push') {
      steps {
        // 📦 Secret file(.env.local) → 즉시 source → --build-arg로 바로 전달
        withCredentials([file(credentialsId: 'saegim-frontend', variable: 'ENV_FILE')]) {
          // Docker 빌드 전 필수 환경변수 추가 검증
          script {
            if (!env.CONTEXT_DIR || !env.DOCKERFILE_PATH) {
              error "Required environment variables not set: CONTEXT_DIR=${env.CONTEXT_DIR}, DOCKERFILE_PATH=${env.DOCKERFILE_PATH}"
            }
          }
          sh '''#!/usr/bin/env bash
            set -euo pipefail

            # ===== .env 파일 로드 =====
            set -o allexport
            . "$ENV_FILE"  # 실제 .env 파일 경로로 치환하세요
            set +o allexport

            # ===== 필수 키 목록 =====
            req="NEXT_PUBLIC_API_BASE_URL GOOGLE_REDIRECT_URI NEXT_PUBLIC_FIREBASE_API_KEY NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN NEXT_PUBLIC_FIREBASE_PROJECT_ID NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID NEXT_PUBLIC_FIREBASE_APP_ID NEXT_PUBLIC_FIREBASE_VAPID_KEY"

            miss=0
            missing=""

            for k in $req; do
              if [ -z "${!k:-}" ]; then
                miss=$((miss+1))
                missing="$missing $k"
              else
                # 환경변수 값 마스킹 (보안상 값 노출 방지)
                echo "$k=***MASKED***"
              fi
            done

            if (( miss > 0 )); then
              echo "[ERROR] 누락된 환경변수:$missing" 1>&2
              exit 2
            fi

            # ===== 태그 계산 =====
            REG_PREFIX=""
            if [ -n "${DOCKER_REGISTRY}" ]; then
              REG_PREFIX="${DOCKER_REGISTRY}/"
            fi
            IMAGE_TAG_LATEST="${REG_PREFIX}${IMAGE_NAME}:latest"
            IMAGE_TAG_SHA="${REG_PREFIX}${IMAGE_NAME}:${GIT_SHORT_SHA}"

            # ===== Docker Build (ARG 직접 주입) =====
            # 보안상 빌드 명령어를 변수로 저장하여 로그 노출 방지
            BUILD_CMD="docker build \\
              --file ${DOCKERFILE_PATH} \\
              --label ${IMAGE_LABEL_SOURCE}=${GIT_REPOSITORY_URL} \\
              --label ${IMAGE_LABEL_OWNER}=${IMAGE_NAME} \\
              --label org.opencontainers.image.revision=${GIT_SHORT_SHA} \\
              --tag \"${IMAGE_TAG_LATEST}\" \\
              --tag \"${IMAGE_TAG_SHA}\" \\
              --build-arg NEXT_PUBLIC_API_BASE_URL=\"${NEXT_PUBLIC_API_BASE_URL}\" \\
              --build-arg GOOGLE_REDIRECT_URI=\"${GOOGLE_REDIRECT_URI}\" \\
              --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=\"${NEXT_PUBLIC_FIREBASE_API_KEY}\" \\
              --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=\"${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}\" \\
              --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=\"${NEXT_PUBLIC_FIREBASE_PROJECT_ID}\" \\
              --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=\"${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}\" \\
              --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=\"${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}\" \\
              --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=\"${NEXT_PUBLIC_FIREBASE_APP_ID}\" \\
              --build-arg NEXT_PUBLIC_FIREBASE_VAPID_KEY=\"${NEXT_PUBLIC_FIREBASE_VAPID_KEY}\" \\
              ${CONTEXT_DIR}"
            
            echo "Starting Docker build with masked arguments..."
            eval "\$BUILD_CMD"

            # ===== Push (레지스트리 설정된 경우에만) =====
            if [ -n "${DOCKER_REGISTRY}" ]; then
              docker push "${IMAGE_TAG_LATEST}"
              docker push "${IMAGE_TAG_SHA}"
            else
              echo "DOCKER_REGISTRY not set — skipping push (built locally only)."
            fi

            # ===== 다음 post 단계에서 쓰도록 환경변수 export =====
            #    (Jenkins env에 반영되도록 echo "::set-output" 류는 미사용; 여기서는 파일 없이 변수 재계산)
            echo "IMAGE_TAG_LATEST=${IMAGE_TAG_LATEST}" > .tags.env
            echo "IMAGE_TAG_SHA=${IMAGE_TAG_SHA}"     >> .tags.env
          '''
        }

        // 스크립트 스코프 변수로 다시 읽어 post에서 활용
        script {
          def tags = readFile('.tags.env').split('\n').collectEntries { line ->
            def kv = line.trim().split('=', 2)
            [(kv[0]): (kv.length > 1 ? kv[1] : "")]
          }
          env.IMAGE_TAG_LATEST = tags['IMAGE_TAG_LATEST'] ?: ''
          env.IMAGE_TAG_SHA    = tags['IMAGE_TAG_SHA']    ?: ''
        }
      }
    }
  }

  post {
    success {
      echo "✅ 성공 — 이미지 빌드(및 필요 시 푸시) 완료"
    }
    failure {
      echo "❌ 실패 — Detect Build Context · 변수 설정 · 빌드 로그 확인"
    }
    always {
      script {
        sh '''
          set -e

          # 1) 이번 빌드에서 만든 태그 이미지를 로컬에서만 제거 (타 팀 영향 없음)
          if [ -n "${IMAGE_TAG_SHA}" ]; then
            docker image rm -f "${IMAGE_TAG_SHA}" || true
          fi
          if [ -n "${IMAGE_TAG_LATEST}" ]; then
            docker image rm -f "${IMAGE_TAG_LATEST}" || true
          fi

          # 2) 이 저장소 레이블로 표시된(dangling) 레이어만 정리 (전역 prune 금지)
          docker image prune -f --filter "label=${IMAGE_LABEL_SOURCE}=${GIT_REPOSITORY_URL}" || true

          # 3) 옵션: 48시간 이상 지난 '이 저장소 레이블의 dangling'만 추가 정리
          if [ "${PRUNE_OLD_DANGLING:-0}" = "true" ] || [ "${PRUNE_OLD_DANGLING:-0}" = "1" ]; then
            docker image prune -f --filter "label=${IMAGE_LABEL_SOURCE}=${GIT_REPOSITORY_URL}" --filter "until=48h" || true
          fi

          # 4) (로그인했을 때만) 레지스트리 로그아웃
          if [ -n "${DOCKER_REGISTRY}" ]; then
            docker logout "${DOCKER_REGISTRY}" || true
          fi
        '''
      }
    }
  }
}
