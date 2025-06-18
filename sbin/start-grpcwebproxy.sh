#! /bin/bash

grpc_server_port=9090
proxy_grpc_server_port=8080

grpcwebproxy --backend_addr=127.0.0.1:$grpc_server_port --allow_all_origins --server_http_debug_port=$proxy_grpc_server_port --run_tls_server=false
