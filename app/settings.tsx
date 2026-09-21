import { router } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BottomNav } from "@/components/BottomNav";
import { useAppPreferences, useAppTheme } from "@/providers/AppPreferences";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabase";
import { clearHistory } from "@/services/history";
import { clearMemory } from "@/services/memory";
import { radius, spacing } from "@/theme";

function Section({ title, children, c }: any) {
  return <View style={styles.sectionWrap}><Text style={[styles.sectionLabel,{color:c.textMuted}]}>{title}</Text><View style={[styles.section,{backgroundColor:c.surface,borderColor:c.border}]}>{children}</View></View>;
}
function Row({ icon, label, value, onPress, c, danger=false }: any) {
  return <Pressable onPress={onPress} style={[styles.row,{borderBottomColor:c.border}]}>
    <Ionicons name={icon} size={20} color={danger?c.danger:c.text}/>
    <Text style={[styles.rowLabel,{color:danger?c.danger:c.text}]}>{label}</Text>
    {value ? <Text style={[styles.value,{color:c.textMuted}]}>{value}</Text> : null}
    {onPress ? <Ionicons name="chevron-forward" size={17} color={c.textMuted}/> : null}
  </Pressable>;
}
function ToggleRow({ icon, label, description, value, onValueChange, c }: any) {
  return <View style={[styles.toggleRow,{borderBottomColor:c.border}]}>
    <Ionicons name={icon} size={20} color={c.text}/>
    <View style={{flex:1}}><Text style={[styles.rowLabel,{color:c.text}]}>{label}</Text>{description ? <Text style={[styles.desc,{color:c.textMuted}]}>{description}</Text> : null}</View>
    <Switch value={value} onValueChange={onValueChange}/>
  </View>;
}

export default function SettingsScreen(){
  const { colors:c }=useAppTheme();
  const { preferences, setPreference, resetPreferences }=useAppPreferences();
  const { user }=useAuth();

  async function signOut(){ if (supabase) await supabase.auth.signOut(); }

  return <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]} edges={["top","left","right","bottom"]}>
    <View style={styles.header}><Text style={[styles.title,{color:c.text}]}>Settings</Text></View>
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
      <Pressable onPress={()=>router.push(user?"/account":"/auth")} style={[styles.profile,{backgroundColor:c.surface,borderColor:c.border}]}>
        <View style={[styles.avatar,{backgroundColor:c.surfaceMuted}]}><Ionicons name="person-outline" size={25} color={c.text}/></View>
        <View style={{flex:1}}>
          <Text style={[styles.profileTitle,{color:c.text}]}>{user?.email ?? "Create or sign in"}</Text>
          <Text style={[styles.profileText,{color:c.textMuted}]}>{user?"Account settings sync is active":"Keep account settings and saved account data linked"}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.textMuted}/>
      </Pressable>

      <Section title="GENERAL" c={c}>
        <Row icon="language-outline" label="Language" value={preferences.language==="en"?"English":preferences.language.toUpperCase()} onPress={()=>router.push("/language")} c={c}/>
        <Row icon="sunny-outline" label="Appearance" value={preferences.appearance==="light"?"Light":preferences.appearance==="dark"?"Dark":"System"} onPress={()=>router.push("/appearance")} c={c}/>
        <ToggleRow icon="notifications-outline" label="Notifications" value={preferences.notifications} onValueChange={(v:boolean)=>setPreference("notifications",v)} c={c}/>
        <ToggleRow icon="alert-circle-outline" label="Safety reminders" value={preferences.safetyReminders} onValueChange={(v:boolean)=>setPreference("safetyReminders",v)} c={c}/>
      </Section>

      <Section title="PERSONALIZATION" c={c}>
        <ToggleRow icon="sparkles-outline" label="Improve PheleCheck" description="Allow reviewed, de-identified data from your checks to help train future Sentinel versions." value={preferences.improvePheleCheck} onValueChange={(v:boolean)=>setPreference("improvePheleCheck",v)} c={c}/>
        <ToggleRow icon="hardware-chip-outline" label="Memory" description="Remember useful preferences and context across your future checks." value={preferences.memoryEnabled} onValueChange={(v:boolean)=>setPreference("memoryEnabled",v)} c={c}/>
        <ToggleRow icon="time-outline" label="Save check history" description="Keep your previous checks available in History." value={preferences.saveHistory} onValueChange={(v:boolean)=>setPreference("saveHistory",v)} c={c}/>
      </Section>

      <Section title="PRIVACY & DATA" c={c}>
        <Row icon="cloud-outline" label="Uploaded images" value="Not stored" c={c}/>
        <Row icon="trash-outline" label="Clear local history" onPress={()=>Alert.alert("Clear history","Remove all saved checks from this device?",[{text:"Cancel",style:"cancel"},{text:"Clear",style:"destructive",onPress:()=>clearHistory()}])} c={c}/>
        <Row icon="hardware-chip-outline" label="Clear memory" onPress={()=>Alert.alert("Clear memory","Remove all locally remembered risk context?",[{text:"Cancel",style:"cancel"},{text:"Clear",style:"destructive",onPress:()=>clearMemory()}])} c={c}/>
        <Row icon="shield-checkmark-outline" label="Privacy & security" onPress={()=>router.push("/privacy")} c={c}/>
      </Section>

      <Section title="PHELECHECK AI" c={c}>
        <Row icon="hardware-chip-outline" label="AI model" value="Sentinel-1" c={c}/>
        <Row icon="pulse-outline" label="Model status" value="Cloud AI + local fallback" c={c}/>
        <Row icon="information-circle-outline" label="How risk scores work" onPress={()=>router.push("/risk-info")} c={c}/>
      </Section>

      <Section title="ACCOUNT & SUPPORT" c={c}>
        <Row icon="help-circle-outline" label="Help center" onPress={()=>router.push("/help")} c={c}/>
        <Row icon="chatbubble-ellipses-outline" label="Send feedback" onPress={()=>router.push("/report")} c={c}/>
        <Row icon="document-text-outline" label="Terms & policies" onPress={()=>router.push("/terms")} c={c}/>
        {user ? <Row icon="log-out-outline" label="Sign out" onPress={signOut} c={c} danger/> : null}
      </Section>

      <Pressable onPress={resetPreferences} style={styles.reset}><Text style={[styles.resetText,{color:c.textMuted}]}>Reset settings to defaults</Text></Pressable>
      <Text style={[styles.version,{color:c.textMuted}]}>PheleCheck 1.2.0 • Sentinel-1</Text>
    </ScrollView>
    <BottomNav active="settings"/>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
 safe:{flex:1},header:{height:64,paddingHorizontal:spacing.lg,justifyContent:"center"},title:{fontSize:24,fontWeight:"800"},
 body:{paddingHorizontal:spacing.lg,paddingBottom:48},profile:{marginTop:10,borderWidth:1,borderRadius:radius.lg,padding:16,flexDirection:"row",alignItems:"center",gap:12},
 avatar:{width:50,height:50,borderRadius:16,alignItems:"center",justifyContent:"center"},profileTitle:{fontSize:15,fontWeight:"800"},profileText:{fontSize:12,marginTop:3},
 sectionWrap:{marginTop:20},sectionLabel:{fontSize:11,fontWeight:"800",letterSpacing:1,marginLeft:4,marginBottom:8},
 section:{borderWidth:1,borderRadius:radius.lg,overflow:"hidden"},
 row:{minHeight:58,paddingHorizontal:16,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:StyleSheet.hairlineWidth},
 toggleRow:{minHeight:72,paddingHorizontal:16,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:StyleSheet.hairlineWidth},
 rowLabel:{fontSize:14,fontWeight:"600"},desc:{fontSize:11,lineHeight:16,marginTop:3,maxWidth:250},value:{fontSize:12,marginLeft:"auto"},
 reset:{paddingVertical:20,alignItems:"center"},resetText:{fontSize:12},version:{fontSize:11,textAlign:"center",marginBottom:6}
});
