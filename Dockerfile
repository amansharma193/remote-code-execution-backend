FROM public.ecr.aws/lambda/nodejs:18

RUN yum install -y \
    gcc-c++ \
    python3 \
    python3-devel \
    java-1.8.0-openjdk-devel

COPY index.js ${LAMBDA_TASK_ROOT}

COPY package.json ${LAMBDA_ROOT_TASK}

RUN npm install

CMD ["index.handler"]