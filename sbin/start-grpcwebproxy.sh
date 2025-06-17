#! /bin/zsh

grpcwebproxy --backend_addr=127.0.0.1:9090 --allow_all_origins --server_http_debug_port=8080 --run_tls_server=false
