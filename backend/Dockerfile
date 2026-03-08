# EthaSmart Backend - Flask API
# Build: docker build -t ethasmart-backend .
# Run (port 7021):  docker run -p 7021:7021 ethasmart-backend
# Run (custom map): docker run -p 8080:7021 ethasmart-backend
# Run (custom port): docker run -e PORT=9000 -p 9000:9000 ethasmart-backend
FROM python:3.12-slim

WORKDIR /app

# Default port 7021; override with -e PORT=... when running
ENV PORT=7021

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

# Default port 7021 (override with -e PORT=... when running)
EXPOSE 7021

# Run on 0.0.0.0 so container accepts external connections; port from PORT env
CMD ["sh", "-c", "exec python app.py"]
