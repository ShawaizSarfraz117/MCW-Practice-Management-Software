#!/bin/bash

# Update imports that reference the UI components
find apps/back-office/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|from "../ui/([^"]+)"|from "@mcw/ui"|g'
find apps/back-office/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|from "../../components/ui/([^"]+)"|from "@mcw/ui"|g'
find apps/back-office/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|from "../components/ui/([^"]+)"|from "@mcw/ui"|g'
find apps/back-office/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|from "@/components/ui/([^"]+)"|from "@mcw/ui"|g'

echo "Import statements updated!" 