// Jenkinsfile (no extra plugins required)
pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timestamps()
    // ansiColor('xterm')  <-- 제거
  }

  // GUI에서 "GitHub hook trigger for GITScm polling" 체크했으므로 여기 트리거는 생략 가능
  // 필요하면 아래 주석 해제
  // triggers { githubPush() }

  environment {
    CI = 'true'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'echo "Checked out commit: $(git rev-parse --short HEAD) on branch: $(git rev-parse --abbrev-ref HEAD)"'
      }
    }

    stage('Show Node & npm') {
      steps {
        sh '''
          set -e
          if command -v node >/dev/null 2>&1; then node -v; else echo "[WARN] node not found"; fi
          if command -v npm  >/dev/null 2>&1; then npm -v;  else echo "[WARN] npm  not found"; fi
        '''
      }
    }

    stage('Prepare .env.local (optional)') {
      steps {
        sh '''
          if [ -f .env.local ]; then
            echo "[INFO] .env.local found in repo."
          else
            echo "[WARN] .env.local not found in workspace. Build will continue without it."
          fi
        '''
      }
    }

    stage('Install deps') {
      steps {
        sh '''
          set -e
          if ! command -v npm >/dev/null 2>&1; then
            echo "[ERROR] npm is not installed on this agent."
            echo "Install Node.js or switch this job to a Docker agent with node image."
            exit 1
          fi
          npm ci --no-audit --prefer-offline || npm install
        '''
      }
    }

    stage('Test (optional)') {
      when {
        expression { return params.RUN_TESTS == null ? true : params.RUN_TESTS }
      }
      steps {
        sh '''
          if npm run | grep -q "^  test"; then
            npm test --if-present
          else
            echo "[INFO] no test script; skipping."
          fi
        '''
      }
    }

    stage('Build') {
      steps {
        sh '''
          if npm run | grep -q "^  build"; then
            npm run build
          else
            echo "[WARN] no build script; skipping."
          fi
        '''
      }
    }

    stage('Archive (optional)') {
      steps {
        sh 'ls -al || true'
      }
    }
  }

  post {
    success { echo '✅ Build success' }
    failure { echo '❌ Build failed' }
    always  { cleanWs() }
  }
}
