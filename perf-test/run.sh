#! /bin/bash

SCRIPT=$(realpath "$0")
SCRIPTPATH=$(dirname "$SCRIPT")

${SCRIPTPATH}/ghz --config perf-test/ghz-config.json | curl -H "Content-Type: application/json" -X POST --data-binary @- localhost:9999/api/ingest