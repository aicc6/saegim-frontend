pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '30'))
    disableConcurrentBuilds()
  }

  parameters {
    choice(name: 'BRANCH_TO_BUILD', choices: ['develop','main','release/latest'], description: '빌드 브랜치')
  }

  triggers {
    githubPush()
  }

  environment {
    // 필수
    GIT_URL = 'https://github.com/aicc6/saegim-frontend.git'
    DOCKER_IMAGE_PATH = 'aicc/saegim-frontend'

    // 선택(없으면 push 단계 skip)
    DOCKER_REGISTRY    = "${env.CUSTOM_DOCKER_REGISTRY ?: ''}"
    DOCKER_CREDENTIALS = "${env.CUSTOM_DOCKER_CREDENTIALS ?: ''}"
  }

  stages {
    stage('Resolve Branch') {
      steps {
        script {
          // Webhook 시 멀티브랜치가 아니라면 env.GIT_BRANCH/BRANCH_NAME가 비어있을 수 있음
          def prefer = env.BRANCH_NAME ?: env.GIT_BRANCH
          env.EFFECTIVE_BRANCH = (prefer?.trim()) ? prefer.replaceFirst(/^origin\//,'') : params.BRANCH_TO_BUILD
          if (!env.EFFECTIVE_BRANCH?.trim()) { env.EFFECTIVE_BRANCH = 'develop' }
          echo "▶ Using branch: ${env.EFFECTIVE_BRANCH}"
        }
      }
    }

    stage('Checkout') {
      steps {
        checkout([$class: 'GitSCM',
          branches: [[name: "*/${env.EFFECTIVE_BRANCH}"]],
          userRemoteConfigs: [[url: "${env.GIT_URL}"]],
          doGenerateSubmoduleConfigurations: false,
          extensions: [[$class: 'CloneOption', shallow: true, depth: 15, timeout: 20]]
        ])
        script {
          env.GIT_COMMIT_SHA  = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
          env.GIT_SHORT_SHA   = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        }
      }
    }

    stage('Prepare .env.local (optional)') {
      steps {
        sh '''
          set -euo pipefail
          if [ -f .env.local ]; then
            echo "[INFO] .env.local found in repo"
          else
            echo "[INFO] .env.local not found; creating empty placeholder"
            : > .env.local
          fi
        '''
      }
    }

    stage('Docker Build') {
      steps {
        script {
          env.TAG_BUILD  = "${env.DOCKER_IMAGE_PATH}:${env.GIT_SHORT_SHA}"
          env.TAG_BRANCH = "${env.DOCKER_IMAGE_PATH}:${env.EFFECTIVE_BRANCH}"
          env.TAG_LATEST = (env.EFFECTIVE_BRANCH == 'develop') ? "${env.DOCKER_IMAGE_PATH}:latest" : ""
        }
        sh '''
          set -euo pipefail
          echo "[BUILD] ${TAG_BUILD}"
          docker build -t "${TAG_BUILD}" .
          docker tag "${TAG_BUILD}" "${TAG_BRANCH}"
          if [ -n "${TAG_LATEST}" ]; then docker tag "${TAG_BUILD}" "${TAG_LATEST}"; fi
        '''
      }
    }

    stage('Docker Login & Push (optional)') {
      when { expression { return env.DOCKER_REGISTRY?.trim() && env.DOCKER_CREDENTIALS?.trim() } }
      steps {
        withCredentials([usernamePassword(credentialsId: "${env.DOCKER_CREDENTIALS}", usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
          sh '''
            set -euo pipefail
            echo "${REG_PASS}" | docker login "${DOCKER_REGISTRY}" -u "${REG_USER}" --password-stdin

            docker tag "${TAG_BUILD}"  "${DOCKER_REGISTRY}/${DOCKER_IMAGE_PATH}:${GIT_SHORT_SHA}"
            docker tag "${TAG_BRANCH}"  "${DOCKER_REGISTRY}/${DOCKER_IMAGE_PATH}:${EFFECTIVE_BRANCH}"
            if [ -n "${TAG_LATEST}" ]; then docker tag "${TAG_LATEST}" "${DOCKER_REGISTRY}/${DOCKER_IMAGE_PATH}:latest"; fi

            docker push "${DOCKER_REGISTRY}/${DOCKER_IMAGE_PATH}:${GIT_SHORT_SHA}"
            docker push "${DOCKER_REGISTRY}/${DOCKER_IMAGE_PATH}:${EFFECTIVE_BRANCH}"
            if [ -n "${TAG_LATEST}" ]; then docker push "${DOCKER_REGISTRY}/${DOCKER_IMAGE_PATH}:latest"; fi
          '''
        }
      }
    }
  }

  post {
    failure {
      echo '❌ 빌드 실패: Jenkinsfile 구문/의존성/빌드 로그 확인'
    }
    always {
      sh '''
        set -e
        docker rmi -f "${TAG_BUILD}"  2>/dev/null || true
        docker rmi -f "${TAG_BRANCH}" 2>/dev/null || true
        if [ -n "${TAG_LATEST}" ]; then docker rmi -f "${TAG_LATEST}" 2>/dev/null || true; fi
      '''
    }
  }
}
