FROM nginx:alpine

# Install Node.js and supervisord
RUN apk add --no-cache nodejs npm supervisor

# Install Node dependencies
WORKDIR /app
COPY package.json ./
RUN npm install --production

COPY server.js ./

# Copy static site files
COPY src/ /usr/share/nginx/html/

# Config files
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY supervisord.conf /etc/supervisord.conf

# Log storage volume
VOLUME ["/data/logs"]

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
