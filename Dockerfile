# Use a lightweight Nginx image
FROM nginx:alpine

# Copy all static website files to the Nginx document root
COPY . /usr/share/nginx/html

# Expose port 80 (Cloud Run will interface with this port)
EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
