# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json .
COPY . .

# Install dependencies
RUN yarn install --non-interactive

# Ensure PDF.js worker is available
RUN cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs || true

# Build with backend URL
ARG REACT_APP_BACKEND_URL=http://localhost:8000
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
RUN yarn build

# Runtime stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
