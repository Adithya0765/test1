cmake_minimum_required(VERSION 3.20)
project(QauliumBackendInternStarter LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

FetchContent_Declare(
  httplib
  GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
  GIT_TAG v0.16.3
)

FetchContent_Declare(
  nlohmann_json
  GIT_REPOSITORY https://github.com/nlohmann/json.git
  GIT_TAG v3.11.3
)

FetchContent_MakeAvailable(httplib nlohmann_json)

add_executable(backend_intern_starter
  src/bridge_router.cpp
  src/rest_router_stub.cpp
)

target_include_directories(backend_intern_starter PRIVATE ${httplib_SOURCE_DIR})
target_link_libraries(backend_intern_starter PRIVATE nlohmann_json::nlohmann_json)
