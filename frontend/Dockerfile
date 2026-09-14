# ---- Build Stage ----
FROM node:20-alpine AS build

# 前端调后端的基地址：容器内用相对路径 /api，由 nginx 反代到后端容器
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Serve Stage ----
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# 修正静态资源权限：仓库里的图片等文件可能是 600，COPY 会原样带入，
# 导致 nginx worker（非 root）读不到 → 403（favicon / squad-assets / 收款码等都中招）
RUN chmod -R a+rX /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

# 对外端口 3000（配合 docker run -p 3000:3000）
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
