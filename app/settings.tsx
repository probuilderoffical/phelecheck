import { router } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BottomNav } from "@/components/BottomNav";
import { useAppPreferences, useAppTheme } from "@/providers/AppPreferences";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabase";
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

  return <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]} edges={["top","left","right"]}>
    <View style={styles.header}><Text style={[styles.title,{color:c.text}]}>Settings</Text></View>
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
      <Pressable onPress={()=>user?null:router.push("/auth")} style={[styles.profile,{backgroundColor:c.surface,borderColor:c.border}]}>
        <View style={[styles.avatar,{backgroundColor:c.surfaceMuted}]}><Ionicons name="person-outline" size={25} color={c.text}/></View>
        <View style={{flex:1}}>
          <Text style={[styles.profileTitle,{color:c.text}]}>{user?.email ?? "Create or sign in"}</Text>
          <Text style={[styles.profileText,{color:c.textMuted}]}>{user?"Account sync is active":"Sync history, memory and preferences"}</Text>
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
        <Row icon="cloud-outline" label="Uploaded files" value={preferences.uploadRetention==="immediate"?"Delete immediately":preferences.uploadRetention==="24h"?"Delete after 24h":"Delete after 7 days"} onPress={()=>{
          const next=preferences.uploadRetention==="24h"?"immediate":preferences.uploadRetention==="immediate"?"7d":"24h";
          setPreference("uploadRetention",next);
        }} c={c}/>
        <Row icon="trash-outline" label="Clear local history" onPress={()=>Alert.alert("Clear history","This will remove saved checks from this device. Your account will not be deleted.")} c={c}/>
        <Row icon="hardware-chip-outline" label="Clear memory" onPress={()=>Alert.alert("Clear memory","This will remove locally remembered risk context. Your account settings stay unchanged.")} c={c}/>
        <Row icon="download-outline" label="Export my data" c={c}/>
        <Row icon="shield-checkmark-outline" label="Privacy & security" c={c}/>
      </Section>

      <Section title="PHELECHECK AI" c={c}>
        <Row icon="hardware-chip-outline" label="AI model" value="Sentinel-1" c={c}/>
        <Row icon="pulse-outline" label="Model status" value="Local fallback ready" c={c}/>
        <Row icon="information-circle-outline" label="How risk scores work" c={c}/>
      </Section>

      <Section title="ACCOUNT & SUPPORT" c={c}>
        <Row icon="help-circle-outline" label="Help center" c={c}/>
        <Row icon="chatbubble-ellipses-outline" label="Send feedback" c={c}/>
        <Row icon="document-text-outline" label="Terms & policies" c={c}/>
        {user ? <Row icon="log-out-outline" label="Sign out" onPress={signOut} c={c} danger/> : null}
      </Section>

      <Pressable onPress={resetPreferences} style={styles.reset}><Text style={[styles.resetText,{color:c.textMuted}]}>Reset settings to defaults</Text></Pressable>
      <Text style={[styles.version,{color:c.textMuted}]}>PheleCheck 1.0.0 • Sentinel-1</Text>
    </ScrollView>
    <BottomNav active="settings"/>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
 safe:{flex:1},header:{height:64,paddingHorizontal:spacing.lg,justifyContent:"center"},title:{fontSize:24,fontWeight:"800"},
 body:{paddingHorizontal:spacing.lg,paddingBottom:30},profile:{marginTop:10,borderWidth:1,borderRadius:radius.lg,padding:16,flexDirection:"row",alignItems:"center",gap:12},
 avatar:{width:50,height:50,borderRadius:16,alignItems:"center",justifyContent:"center"},profileTitle:{fontSize:15,fontWeight:"800"},profileText:{fontSize:12,marginTop:3},
 sectionWrap:{marginTop:20},sectionLabel:{fontSize:11,fontWeight:"800",letterSpacing:1,marginLeft:4,marginBottom:8},
 section:{borderWidth:1,borderRadius:radius.lg,overflow:"hidden"},
 row:{minHeight:58,paddingHorizontal:16,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:StyleSheet.hairlineWidth},
 toggleRow:{minHeight:72,paddingHorizontal:16,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:StyleSheet.hairlineWidth},
 rowLabel:{fontSize:14,fontWeight:"600"},desc:{fontSize:11,lineHeight:16,marginTop:3,maxWidth:250},value:{fontSize:12,marginLeft:"auto"},
 reset:{paddingVertical:20,alignItems:"center"},resetText:{fontSize:12},version:{fontSize:11,textAlign:"center",marginBottom:6}
});
