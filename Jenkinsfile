pipeline {
    agent none
    parameters {
        booleanParam(
            name: 'SHOULD_FORCE_PUBLISH_ARTIFACT',
            defaultValue: false,
            description: 'Artifact will be published if CI job runs in master branch. If you want to publish artifact from other branches, please force it.'
        )
    }
    environment { 
        CI = 'true'
    }
    tools {
        nodejs 'v6.11.4'
    }
    stages {
        stage('Wait for Artifact Type') {
            agent none
            when {
                anyOf {
                    branch 'master'
                    expression { return params.SHOULD_FORCE_PUBLISH_ARTIFACT }
                }
            }
            options {
                skipDefaultCheckout() 
            }
            steps {
                script {                
                    env.VERSION_UPGRADE_TYPE = input message: 'Select the type of version of the artifact?', 
                    parameters: [
                        choice(choices: 'SNAPSHOT\nPATCH\nMINOR\nMAJOR', 
                        description: 'If you select the option SNAPSHOT, then BRANCH_NAME__GIT_REVISION will be used as version number and no GIT tag will be added.\n If you select other options, then package.json will be updated with next version based on Semver and also GIT tag will be added.', 
                        name: 'VERSION_UPGRADE_TYPE')
                    ]
                }
                echo "${VERSION_UPGRADE_TYPE}"
            }
        }
        stage('Install Dependencies') {
            agent any
            steps {
                script {              
                    env.PACKAGE_ARTIFACT_BUILD_NUMBER = env.BUILD_NUMBER
                    env.PACKAGE_ARTIFACT_BUILD_JOB_NAME = env.JOB_NAME
                    env.PACKAGE_ARTIFACT_GIT_REVISION = env.GIT_COMMIT
                    env.PACKAGE_ARTIFACT_GIT_BRANCH = env.GIT_BRANCH
                    env.PACKAGE_ARTIFACT_GIT_URL = env.GIT_URL
                }
                echo "${PACKAGE_ARTIFACT_BUILD_NUMBER}"
                echo "${PACKAGE_ARTIFACT_BUILD_JOB_NAME}"
                echo "${PACKAGE_ARTIFACT_GIT_REVISION}"
                echo "${PACKAGE_ARTIFACT_GIT_BRANCH}"
                echo "${PACKAGE_ARTIFACT_GIT_URL}"
                sh '''
                node --version
                npm --version
                npm install
                '''
                stash name: 'source_with_node_modules'
            }
        }
        stage('Static Code Analysis') {
            agent any
            options {
                skipDefaultCheckout() 
            }
            steps {
                unstash 'source_with_node_modules'
                sh 'npm run lint'
            }
        }
        stage('Unit Tests') {
            agent any
            options {
                skipDefaultCheckout() 
            }
            steps {
                unstash 'source_with_node_modules'
                sh 'npm test'
                publishHTML target: [
                    allowMissing:true,
                    alwaysLinkToLastBuild: false,
                    keepAll:true,
                    reportDir: "build/reports/jest/coverage",
                    reportFiles: 'index.html',
                    reportName: "Coverage report"
                  ] 
                stash name: 'coverage_reports', includes: '**/coverage/**'
            }
            post {
                always {
                    junit '**/test/*.xml'
                    cobertura autoUpdateHealth: false,
                        autoUpdateStability: false,
                        coberturaReportFile: '**/coverage/cobertura-coverage.xml',
                        conditionalCoverageTargets: '70, 0, 0',
                        failUnhealthy: false,
                        failUnstable: false,
                        lineCoverageTargets: '80, 0, 0',
                        maxNumberOfBuilds: 0,
                        methodCoverageTargets: '80, 0, 0',
                        onlyStable: false,
                        sourceEncoding: 'ASCII',
                        zoomCoverageChart: false
                }
            }
        }
        stage('Validate Changelog') {
            agent any
            when {
                anyOf {
                    branch 'master'
                    expression { return params.SHOULD_FORCE_PUBLISH_ARTIFACT }
                }
            }
            options {
                skipDefaultCheckout() 
            }
            steps {
                unstash 'source_with_node_modules'
                echo "sh 'npm run changelog:is-updated'"
            }
        }
        stage('Tag with Version') {
            agent any
            when {
                anyOf {
                    branch 'master'
                    environment name: 'VERSION_UPGRADE_TYPE', value: 'MAJOR'
                    environment name: 'VERSION_UPGRADE_TYPE', value: 'MINOR'
                    environment name: 'VERSION_UPGRADE_TYPE', value: 'PATCH'
                }
                not {
                    environment name: 'VERSION_UPGRADE_TYPE', value: 'SNAPSHOT'
                }
            }
            options {
                skipDefaultCheckout() 
            }
            steps {
                unstash 'source_with_node_modules'
                echo "sh 'VERSION_UPGRADE_TYPE=${VERSION_UPGRADE_TYPE} npm version:update'"
                script {   
                    def packageJson = readJSON file: 'package.json'
                    env.PACKAGE_ARTIFACT_VERSION = packageJson.version
                }
                echo "VERSION_UPGRADE_TYPE: ${VERSION_UPGRADE_TYPE}"
                echo "PACKAGE_ARTIFACT_VERSION: ${PACKAGE_ARTIFACT_VERSION}"
                echo "sh 'npm run changelog:make-new-release'"
                echo "sh 'npm run version:git-add'"
                echo "sh 'VERSION_UPGRADE_TYPE=${VERSION_UPGRADE_TYPE} PACKAGE_ARTIFACT_VERSION=${PACKAGE_ARTIFACT_VERSION} npm run version:git-commit'"
                echo "sh 'PACKAGE_ARTIFACT_VERSION=${PACKAGE_ARTIFACT_VERSION} npm run version:git-tag'"
                withCredentials([usernamePassword(credentialsId: "${GITHUB_CREDENTIALS_ID}", passwordVariable: 'GIT_PASSWORD', usernameVariable: 'GIT_USERNAME')]) {
                    // sh('''
                    // npm run version:git-push
                    // ''')
                }
                // archiveArtifacts artifacts: 'CHANGELOG.md'
            }
        }
        stage('Build Artifact') {
            agent any
            when {
                anyOf {
                    branch 'master'
                    expression { return params.SHOULD_FORCE_PUBLISH_ARTIFACT }
                }
            }
            options {
                skipDefaultCheckout() 
            }
            steps {
                script {   
                    def snapshotVersion = "${PACKAGE_ARTIFACT_GIT_BRANCH}__${PACKAGE_ARTIFACT_GIT_REVISION}"           
                    if ("${VERSION_UPGRADE_TYPE}" == "SNAPSHOT")
                        env.PACKAGE_ARTIFACT_VERSION = snapshotVersion
                }
                echo "VERSION_UPGRADE_TYPE: ${VERSION_UPGRADE_TYPE}"
                echo "PACKAGE_ARTIFACT_VERSION: ${PACKAGE_ARTIFACT_VERSION}"
                unstash 'source_with_node_modules'
                // sh '''
                // npm run artifact:build
                // '''
                // stash name: 'artifact', includes: 'build/target/**'
                // archiveArtifacts artifacts: 'build/target/**'
            }
        }
        stage('Publishing artifact') {
            agent any
            when {
                anyOf {
                    branch 'master'
                    expression { return params.SHOULD_FORCE_PUBLISH_ARTIFACT }
                }
            }
            options {
                skipDefaultCheckout() 
            }
            steps {
                // unstash 'artifact'
                echo 'publishing to artifactory'
            }
        }
        stage('Sending to Deployment Pipeline Queue') {
            agent any
            when {
                anyOf {
                    branch 'master'
                    expression { return params.SHOULD_FORCE_PUBLISH_ARTIFACT }
                }
            }
            options {
                skipDefaultCheckout() 
            }
            steps {
                echo 'Sending to Deployment Pipeline Queue' 
                build job: 'nodejs-api-skeleton/deployment-pipeline-queue', parameters: [
                        string(name: 'PACKAGE_ARTIFACT_VERSION', value: env.PACKAGE_ARTIFACT_VERSION),
                        string(name: 'PACKAGE_ARTIFACT_VERSION_UPGRADE_TYPE', value: env.VERSION_UPGRADE_TYPE),
                        string(name: 'PACKAGE_ARTIFACT_BUILD_NUMBER', value: env.PACKAGE_ARTIFACT_BUILD_NUMBER),
                        string(name: 'PACKAGE_ARTIFACT_BUILD_JOB_NAME', value: env.PACKAGE_ARTIFACT_BUILD_JOB_NAME),
                        string(name: 'PACKAGE_ARTIFACT_GIT_REVISION', value: env.PACKAGE_ARTIFACT_GIT_REVISION),
                        string(name: 'PACKAGE_ARTIFACT_GIT_BRANCH', value: env.PACKAGE_ARTIFACT_GIT_BRANCH),
                        string(name: 'PACKAGE_ARTIFACT_GIT_URL', value: env.PACKAGE_ARTIFACT_GIT_URL)
                    ], wait: false
            }
        }
    }
    post { 
        always { 
            echo 'always run'
        }
        changed { 
            echo 'changed run'
        }
        failure { 
            echo 'failure run'
        }
        success { 
            echo 'success run'
        }
        unstable { 
            echo 'unstable run'
        }
        aborted { 
            echo 'aborted run'
        }
    }
}
