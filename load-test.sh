#!/bin/bash

# Initialize the result file
RESULT_FILE="load-test-result.txt"
echo "Flash Sale Load Test Results" > $RESULT_FILE
echo "============================" >> $RESULT_FILE
echo "Test Date: $(date)" >> $RESULT_FILE
echo "Target: http://localhost:3001/api/flashsale/purchase" >> $RESULT_FILE
echo "Number of concurrent requests: X" >> $RESULT_FILE
echo "" >> $RESULT_FILE

echo "Starting flash sale load test with X concurrent requests..."
echo "Results will be saved to: $RESULT_FILE"
echo "----------------------------------------"

# Add test start info to result file
echo "Test started at: $(date)" >> $RESULT_FILE
echo "----------------------------------------" >> $RESULT_FILE

for i in {1..9999}; do
  echo "Sending request $i..."
  curl -X POST http://localhost:3001/api/flashsale/purchase \
    -H "Content-Type: application/json" \
    -d '{"userId":"user'$i'","flashSaleId":"532cd7a5-c010-4854-8e56-ec99c0b9a014"}' \
    -w "Request $i - Status: %{http_code} - Time: %{time_total}s - Size: %{size_download} bytes\n" \
    -s -o response_$i.json >> $RESULT_FILE 2>&1 &
done

echo "Waiting for all requests to complete..."
wait

echo "----------------------------------------" >> $RESULT_FILE
echo "Individual Response Details:" >> $RESULT_FILE
echo "----------------------------------------" >> $RESULT_FILE

for i in {1..9999}; do
  if [ -f response_$i.json ]; then
    echo "" >> $RESULT_FILE
    echo "=== Response $i ===" >> $RESULT_FILE
    cat response_$i.json >> $RESULT_FILE
    echo "" >> $RESULT_FILE
  fi
done

echo "" >> $RESULT_FILE
echo "----------------------------------------" >> $RESULT_FILE
echo "Test completed at: $(date)" >> $RESULT_FILE

echo "Cleaning up temporary files..."
rm -f response_*.json

echo "----------------------------------------"
echo "Load test finished! Results saved to: $RESULT_FILE"
echo "You can view the results by opening the file: $RESULT_FILE"