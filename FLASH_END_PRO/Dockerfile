FROM python:3.12-slim

WORKDIR /app

# 环境变量：不使用 .pyc、日志不缓冲（容器日志实时可见）
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 编译部分依赖（bcrypt / asyncmy 等）需要 gcc
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖（先装依赖再拷源码，充分利用构建缓存）
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制源码（.env 已被 .dockerignore 排除，配置一律走容器环境变量）
COPY . .

# 上传目录（建议用 volume 持久化：-v flash_uploads:/app/uploads）
RUN mkdir -p /app/uploads

# 对外端口 8000
EXPOSE 8000

# 健康检查：容器内自检 /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3).status==200 else 1)"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
