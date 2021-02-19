FROM postgres:13.0

RUN mkdir -p /docker-entrypoint-initdb.d
COPY setup.sql /docker-entrypoint-initdb.d/
