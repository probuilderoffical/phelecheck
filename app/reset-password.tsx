import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAppTheme } from "@/providers/AppPreferences";
import { spacing } from "@/theme";

function paramsFromUrl(url: string) {
  const hash = url.includes("#") ? url.split("#")[1] : "";
  const query = url.includes("?") ? url.split("?")[1].split("#")[0] : "";
  return new URLSearchParams(hash || query);
}

export default function ResetPasswordScreen(){
  const {scheme,colors:c}=useAppTheme();
  const [password,setPassword]=useState("");
  const [ready,setReady]=useState(false);
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    let mounted=true;
    (async()=>{
      const url=await Linking.getInitialURL();
      if(url){
        const p=paramsFromUrl(url);
        const access=p.get("access_token");
        const refresh=p.get("refresh_token");
        if(access&&refresh) await supabase.auth.setSession({access_token:access,refresh_token:refresh});
      }
      const {data:{session}}=await supabase.auth.getSession();
      if(mounted) setReady(Boolean(session));
    })();
    const sub=Linking.addEventListener("url",async({url})=>{
      const p=paramsFromUrl(url);
      const access=p.get("access_token");
      const refresh=p.get("refresh_token");
      if(access&&refresh){
        await supabase.auth.setSession({access_token:access,refresh_token:refresh});
        setReady(true);
      }
    });
    return()=>{mounted=false;sub.remove();};
  },[]);

  async function save(){
    if(password.length<8){Alert.alert("Use a stronger password","Use at least 8 characters.");return;}
    setSaving(true);
    const {error}=await supabase.auth.updateUser({password});
    setSaving(false);
    if(error) Alert.alert("Could not update password",error.message);
    else {Alert.alert("Password updated","You can now use your new password.");router.replace("/");}
  }

  return <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]} edges={["top","left","right","bottom"]}>
    <View style={styles.body}>
      <Text style={[styles.title,{color:c.text}]}>Choose a new password</Text>
      <Text style={[styles.help,{color:c.textMuted}]}>{ready?"Enter a new password for your PheleCheck account.":"Open the password-reset link from your email on this phone first."}</Text>
      <TextInput value={password} onChangeText={setPassword} editable={ready} secureTextEntry placeholder="New password" placeholderTextColor={c.textMuted} style={[styles.input,{backgroundColor:c.surface,borderColor:c.border,color:c.text,opacity:ready?1:0.6}]}/>
      <Pressable disabled={!ready||saving} onPress={save} style={[styles.button,{backgroundColor:ready?c.text:c.surfaceMuted}]}>
        <Text style={[styles.buttonText,{color:ready?(scheme==="dark"?"#111":"#fff"):c.textMuted}]}>{saving?"Updating...":"Update password"}</Text>
      </Pressable>
      <Pressable onPress={()=>router.replace("/auth")} style={styles.back}><Text style={[styles.backText,{color:c.textMuted}]}>Back to sign in</Text></Pressable>
    </View>
  </SafeAreaView>
}
const styles=StyleSheet.create({
 safe:{flex:1},body:{flex:1,paddingHorizontal:spacing.lg,paddingTop:70},
 title:{fontSize:30,fontWeight:"800",letterSpacing:-1},help:{fontSize:14,lineHeight:21,marginTop:9,marginBottom:26},
 input:{height:56,borderWidth:1,borderRadius:16,paddingHorizontal:16,fontSize:15},
 button:{height:56,borderRadius:28,alignItems:"center",justifyContent:"center",marginTop:16},
 buttonText:{fontSize:15,fontWeight:"800"},back:{alignItems:"center",paddingVertical:20},backText:{fontSize:13}
});