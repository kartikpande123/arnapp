########## React Native Core ##########
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

########## Hermes ##########
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**
-keep class com.facebook.jni.** { *; }

########## JSI / TurboModules ##########
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

########## React Navigation / Gesture Handler ##########
-keep class com.swmansion.** { *; }
-dontwarn com.swmansion.**
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.reanimated.** { *; }

########## Async Storage ##########
-keep class com.reactnativecommunity.asyncstorage.** { *; }

########## AndroidX ##########
-keep class androidx.** { *; }
-dontwarn androidx.**

########## Network Libraries (okhttp / okio) ##########
-keep class okhttp3.** { *; }
-dontwarn okhttp3.**

-keep class okio.** { *; }
-dontwarn okio.**

########## Gson ##########
-keep class com.google.gson.** { *; }
-dontwarn com.google.gson.**

########## Glide / Image Loader (if used) ##########
-keep class com.bumptech.glide.** { *; }
-dontwarn com.bumptech.glide.**

########## Vector Icons ##########
-keep class com.oblador.vectoricons.** { *; }
-dontwarn com.oblador.vectoricons.**

########## Firebase (safe to include even if not used) ##########
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

########## Prevent stripping of JS bundle ##########
-keep class com.facebook.react.packagerasset.** { *; }

########## Prevent obfuscation of model classes ##########
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
