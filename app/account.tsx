import { router } from "expo-router";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/providers/AuthProvider";
import { useAppTheme } from "@/providers/AppPreferences";
import { supabase } from "@/lib/supabase";
import { radius, spacing } from "@/theme";

export default function AccountScreen(){
  const {scheme,colors:c}=useAppTheme();
  const {user}=useAuth();

  if(!user){
    return <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]} edges={["top","left","right","bottom"]}>
      <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Ionicons name="arrow-back" size={23} color={c.text}/></Pressable><Text style={[styles.headerTitle,{color:c.text}]}>Account</Text><View style={styles.back}/></View>
      <View style={styles.empty}>
        <Text style={[styles.title,{color:c.text}]}>You're not signed in</Text>
        <Text style={[styles.subtitle,{color:c.textMuted}]}>Sign in to keep account settings linked and manage your saved account data.</Text>
        <Pressable onPress={()=>router.replace("/auth")} style={[styles.primary,{backgroundColor:c.text}]}>
          <Text style={[styles.primaryText,{color:scheme==="dark"?"#111":"#fff"}]}>Sign in or create account</Text>
        </Pressable>
      </View>
    </SafeAreaView>;
  }

  const currentUser = user;

  async function signOut(){
    await supabase.auth.signOut();
    router.back();
  }

  async function exportData(){
    try{
      const [profile,checks,memories,reports]=await Promise.all([
        supabase.from("profiles").select("*").eq("id",currentUser.id).maybeSingle(),
        supabase.from("checks").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false}),
        supabase.from("memories").select("*").eq("user_id",currentUser.id),
        supabase.from("scam_reports").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false})
      ]);

      const payload={
        exportedAt:new Date().toISOString(),
        account:{id:currentUser.id,email:currentUser.email},
        profile:profile.data ?? null,
        checks:checks.data ?? [],
        memories:memories.data ?? [],
        scamReports:reports.data ?? []
      };

      await Share.share({
        title:"PheleCheck account data",
        message:JSON.stringify(payload,null,2)
      });
    }catch{
      Alert.alert("Could not export","Please try again.");
    }
  }

  async function deleteAccount(){
    Alert.alert(
      "Delete account?",
      "This permanently deletes your PheleCheck account and user-linked data. This cannot be undone.",
      [
        {text:"Cancel",style:"cancel"},
        {
          text:"Delete permanently",
          style:"destructive",
          onPress:async()=>{
            const {data,error}=await supabase.functions.invoke("delete-account",{body:{confirm:true}});
            if(error || data?.error){
              Alert.alert("Could not delete account",data?.error ?? error?.message ?? "Please try again.");
              return;
            }
            await supabase.auth.signOut();
            Alert.alert("Account deleted","Your PheleCheck account was deleted.");
            router.replace("/");
          }
        }
      ]
    );
  }

  return <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]} edges={["top","left","right","bottom"]}>
    <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Ionicons name="arrow-back" size={23} color={c.text}/></Pressable><Text style={[styles.headerTitle,{color:c.text}]}>Account</Text><View style={styles.back}/></View>
    <View style={styles.body}>
      <View style={[styles.card,{backgroundColor:c.surface,borderColor:c.border}]}>
        <View style={[styles.avatar,{backgroundColor:c.surfaceMuted}]}><Ionicons name="person" size={28} color={c.text}/></View>
        <Text style={[styles.email,{color:c.text}]}>{currentUser.email}</Text>
        <Text style={[styles.meta,{color:c.textMuted}]}>PheleCheck account</Text>
      </View>

      <View style={[styles.list,{backgroundColor:c.surface,borderColor:c.border}]}>
        <View style={[styles.row,{borderBottomColor:c.border}]}><Ionicons name="sync-outline" size={20} color={c.text}/><Text style={[styles.rowText,{color:c.text}]}>Sync</Text><Text style={[styles.value,{color:c.success}]}>Active</Text></View>
        <Pressable onPress={()=>router.push("/reset-password")} style={[styles.row,{borderBottomColor:c.border}]}><Ionicons name="shield-checkmark-outline" size={20} color={c.text}/><Text style={[styles.rowText,{color:c.text}]}>Account security</Text><Ionicons name="chevron-forward" size={18} color={c.textMuted}/></Pressable>
        <Pressable onPress={exportData} style={[styles.row,{borderBottomColor:c.border}]}><Ionicons name="download-outline" size={20} color={c.text}/><Text style={[styles.rowText,{color:c.text}]}>Export account data</Text><Ionicons name="chevron-forward" size={18} color={c.textMuted}/></Pressable>
      </View>

      <Pressable onPress={signOut} style={[styles.danger,{borderColor:c.border}]}><Ionicons name="log-out-outline" size={19} color={c.danger}/><Text style={[styles.dangerText,{color:c.danger}]}>Sign out</Text></Pressable>
      <Pressable onPress={deleteAccount} style={styles.delete}><Text style={[styles.deleteText,{color:c.danger}]}>Delete account permanently</Text></Pressable>
    </View>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
 safe:{flex:1},header:{height:60,paddingHorizontal:spacing.lg,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{width:40,height:40,alignItems:"center",justifyContent:"center"},headerTitle:{fontSize:17,fontWeight:"800"},
 empty:{padding:spacing.lg,paddingTop:70},title:{fontSize:28,fontWeight:"800"},subtitle:{fontSize:14,lineHeight:21,marginTop:8},primary:{height:54,borderRadius:27,alignItems:"center",justifyContent:"center",marginTop:24},primaryText:{fontSize:15,fontWeight:"800"},
 body:{padding:spacing.lg},card:{borderWidth:1,borderRadius:radius.lg,padding:24,alignItems:"center"},avatar:{width:64,height:64,borderRadius:22,alignItems:"center",justifyContent:"center"},email:{fontSize:17,fontWeight:"800",marginTop:14},meta:{fontSize:12,marginTop:4},
 list:{borderWidth:1,borderRadius:radius.lg,overflow:"hidden",marginTop:16},row:{height:58,paddingHorizontal:16,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:StyleSheet.hairlineWidth},rowText:{flex:1,fontSize:14,fontWeight:"600"},value:{fontSize:12,fontWeight:"700"},
 danger:{height:54,borderWidth:1,borderRadius:27,marginTop:20,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},dangerText:{fontSize:14,fontWeight:"800"},delete:{padding:18,alignItems:"center"},deleteText:{fontSize:12,fontWeight:"700"}
});
