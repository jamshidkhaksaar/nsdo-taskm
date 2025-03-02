#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting test suite for the entire application...${NC}"

# Run frontend tests
echo -e "\n${YELLOW}Running frontend tests...${NC}"
cd frontend
npm test -- --watchAll=false
FRONTEND_RESULT=$?

if [ $FRONTEND_RESULT -eq 0 ]; then
  echo -e "${GREEN}Frontend tests passed!${NC}"
else
  echo -e "${RED}Frontend tests failed!${NC}"
fi

# Run backend unit tests
echo -e "\n${YELLOW}Running backend unit tests...${NC}"
cd ../backend-nest
npm test
BACKEND_UNIT_RESULT=$?

if [ $BACKEND_UNIT_RESULT -eq 0 ]; then
  echo -e "${GREEN}Backend unit tests passed!${NC}"
else
  echo -e "${RED}Backend unit tests failed!${NC}"
fi

# Run backend E2E tests
echo -e "\n${YELLOW}Running backend E2E tests...${NC}"
npm run test:e2e
BACKEND_E2E_RESULT=$?

if [ $BACKEND_E2E_RESULT -eq 0 ]; then
  echo -e "${GREEN}Backend E2E tests passed!${NC}"
else
  echo -e "${RED}Backend E2E tests failed!${NC}"
fi

# Return to the root directory
cd ..

# Check if all tests passed
if [ $FRONTEND_RESULT -eq 0 ] && [ $BACKEND_UNIT_RESULT -eq 0 ] && [ $BACKEND_E2E_RESULT -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed successfully!${NC}"
  exit 0
else
  echo -e "\n${RED}Some tests failed. Please check the output above for details.${NC}"
  exit 1
fi 