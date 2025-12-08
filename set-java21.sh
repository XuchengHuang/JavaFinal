#!/bin/bash
# 设置 Java 21 环境变量

export JAVA_HOME="/opt/homebrew/Cellar/openjdk@21/21.0.6/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

echo "Java 环境已设置为 Java 21"
echo "JAVA_HOME: $JAVA_HOME"
echo "Java 版本: $(java -version 2>&1 | head -1)"
echo "Maven 使用的 Java: $(mvn -version 2>&1 | grep "Java version" | head -1)"

