import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BottomNav } from "@/components/BottomNav";
import { radius, spacing } from "@/theme";
import { useAppTheme } from "@/providers/AppPreferences";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

export default function ReportScreen(){
  const { scheme, colors: c } = useAppTheme(); const [text,setText]=useState(""); const [sending,setSending]=useState(false);

  async function submitReport(){
    if(!text.trim() || sending) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("submit-report", {
      body: { reportType: "general", reportText: text.trim() }
    });
    setSending(false);
    if(error || data?.error) Alert.alert("Could not submit", data?.error ?? error?.message ?? "Please try again.");
    else { setText(""); Alert.alert("Report received","Thank you. Reports are reviewed before they affect reputation or training."); }
  }
  return <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]} edges={["top","left","right","bottom"]}>
    <View style={styles.header}><Text style={[styles.title,{color:c.text}]}>Report a scam</Text></View>
    <View style={styles.body}>
      <Text style={[styles.help,{color:c.textMuted}]}>Help improve PheleCheck by reporting suspicious numbers, accounts, links or messages.</Text>
      <View style={[styles.card,{backgroundColor:c.surface,borderColor:c.border}]}>
        <TextInput value={text} onChangeText={setText} multiline placeholder="Paste the number, account, link or details" placeholderTextColor={c.textMuted} style={[styles.input,{color:c.text}]}/>
      </View>
      <Pressable onPress={submitReport} disabled={!text.trim()||sending} style={[styles.button,{backgroundColor:text.trim()?c.text:c.surfaceMuted}]}>
        <Ionicons name="shield-checkmark-outline" size={18} color={text.trim()?(scheme==="dark"?"#111":"#fff"):c.textMuted}/>
        <Text style={[styles.buttonText,{color:text.trim()?(scheme==="dark"?"#111":"#fff"):c.textMuted}]}>{sending?"Submitting...":"Submit report"}</Text>
      </Pressable>
      <Text style={[styles.note,{color:c.textMuted}]}>Reports will be reviewed before they can affect reputation or model training.</Text>
    </View>
    <BottomNav active="report"/>
  </SafeAreaView>
}
const styles=StyleSheet.create({
 safe:{flex:1},header:{height:64,paddingHorizontal:spacing.lg,justifyContent:"center"},title:{fontSize:24,fontWeight:"800"},
 body:{flex:1,paddingHorizontal:spacing.lg},help:{fontSize:14,lineHeight:21,marginTop:12,marginBottom:18},
 card:{borderWidth:1,borderRadius:radius.lg},input:{minHeight:180,padding:18,textAlignVertical:"top",fontSize:15,lineHeight:22},
 button:{height:54,borderRadius:27,marginTop:16,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},
 buttonText:{fontSize:15,fontWeight:"800"},note:{fontSize:12,lineHeight:18,textAlign:"center",marginTop:12}
});
