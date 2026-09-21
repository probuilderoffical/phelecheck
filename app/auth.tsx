import { useState } from "react";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAppTheme } from "@/providers/AppPreferences";
import { radius, spacing } from "@/theme";

export default function AuthScreen() {
  const { scheme, colors: c } = useAppTheme();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function resetPassword() {
    if (!email.trim()) {
      Alert.alert("Enter your email", "Enter the email address for your PheleCheck account first.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "phelecheck://reset-password"
      });
      if (error) throw error;
      Alert.alert("Check your email", "Open the password reset link on this phone, then choose a new password in PheleCheck.");
    } catch (error: any) {
      Alert.alert("Could not send reset email", error?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!supabaseConfigured || !supabase) {
      Alert.alert("Supabase not connected", "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY first.");
      return;
    }
    if (!email.trim() || password.length < 6) {
      Alert.alert("Check details", "Enter a valid email and a password with at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.back();
      } else {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        Alert.alert("Account created", "Check your email if confirmation is enabled, then sign in.");
        setMode("signin");
      }
    } catch (error: any) {
      Alert.alert("Could not continue", error?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]}>
      <View style={styles.header}>
        <Pressable onPress={()=>router.back()} style={styles.icon}><Ionicons name="close" size={24} color={c.text}/></Pressable>
      </View>
      <View style={styles.body}>
        <View style={[styles.logo,{backgroundColor:c.text}]}>
          <Ionicons name="shield-checkmark" size={26} color={scheme==="dark"?"#111":"#fff"}/>
        </View>
        <Text style={[styles.title,{color:c.text}]}>{mode==="signin"?"Welcome back":"Create your account"}</Text>
        <Text style={[styles.subtitle,{color:c.textMuted}]}>
          {mode==="signin"?"Sign in to sync history, memory and settings.":"Create an account to sync PheleCheck across devices."}
        </Text>

        <View style={styles.form}>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor={c.textMuted} style={[styles.input,{backgroundColor:c.surface,borderColor:c.border,color:c.text}]}/>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor={c.textMuted} style={[styles.input,{backgroundColor:c.surface,borderColor:c.border,color:c.text}]}/>
        </View>

        {mode==="signin" ? <Pressable onPress={resetPassword} disabled={loading} style={styles.forgot}>
          <Text style={[styles.forgotText,{color:c.textMuted}]}>Forgot password?</Text>
        </Pressable> : null}

        <Pressable onPress={submit} disabled={loading} style={[styles.primary,{backgroundColor:c.text,opacity:loading?0.6:1}]}>
          <Text style={[styles.primaryText,{color:scheme==="dark"?"#111":"#fff"}]}>{loading?"Please wait...":mode==="signin"?"Sign in":"Create account"}</Text>
        </Pressable>

        <Pressable onPress={()=>setMode(mode==="signin"?"signup":"signin")} style={styles.switch}>
          <Text style={[styles.switchText,{color:c.textMuted}]}>
            {mode==="signin"?"New to PheleCheck? ":"Already have an account? "}
            <Text style={{color:c.text,fontWeight:"800"}}>{mode==="signin"?"Create account":"Sign in"}</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
 safe:{flex:1},header:{height:56,paddingHorizontal:spacing.lg,justifyContent:"center"},icon:{width:40,height:40,alignItems:"center",justifyContent:"center"},
 body:{flex:1,paddingHorizontal:spacing.lg,paddingTop:30},logo:{width:54,height:54,borderRadius:18,alignItems:"center",justifyContent:"center"},
 title:{fontSize:30,fontWeight:"800",letterSpacing:-1,marginTop:22},subtitle:{fontSize:14,lineHeight:21,marginTop:8,maxWidth:330},
 form:{gap:12,marginTop:30},input:{height:56,borderWidth:1,borderRadius:16,paddingHorizontal:16,fontSize:15},
 primary:{height:56,borderRadius:28,alignItems:"center",justifyContent:"center",marginTop:18},primaryText:{fontSize:15,fontWeight:"800"},
 forgot:{alignSelf:"flex-end",paddingVertical:12},forgotText:{fontSize:12,fontWeight:"700"},
 switch:{alignItems:"center",paddingVertical:20},switchText:{fontSize:13}
});
