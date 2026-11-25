cmake_minimum_required(VERSION 3.22.1)

project(vibecodingerterminal LANGUAGES CXX)

add_library(ghostty-vt SHARED IMPORTED)
set_target_properties(
  ghostty-vt
  PROPERTIES IMPORTED_LOCATION
             "${CMAKE_CURRENT_SOURCE_DIR}/../jniLibs/${ANDROID_ABI}/libghostty-vt.so"
)

add_library(vibecodingerterminal SHARED vibecodinger_terminal_jni.cpp)

target_include_directories(
  vibecodingerterminal
  PRIVATE "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../../../../native/libghostty-vt/include"
)

target_link_options(
  vibecodingerterminal PRIVATE "-Wl,-z,common-page-size=16384" "-Wl,-z,max-page-size=16384"
)

target_link_libraries(vibecodingerterminal PRIVATE ghostty-vt log)
