#!/bin/bash

# Generate Python code from .proto file
python -m grpc_tools.protoc -I./protos --python_out=. --grpc_python_out=. ./protos/recommendation.proto

echo "Proto files generated successfully" 