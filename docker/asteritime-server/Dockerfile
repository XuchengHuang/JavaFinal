FROM maven:3.8-openjdk-11 AS build
WORKDIR /app
COPY pom.xml .
COPY asteritime-common ./asteritime-common
COPY asteritime-server ./asteritime-server
RUN mvn clean package -DskipTests

FROM openjdk:11-jre-slim
WORKDIR /app
COPY --from=build /app/asteritime-server/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]


