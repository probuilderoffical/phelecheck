import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BottomNav } from "@/components/BottomNav";
import { colors, radius, spacing } from "@/theme";

const rows=[
  ["language-outline","Language","English"],
  ["moon-outline","Appearance","System"],
  ["notifications-outline","Notifications","On"],
  ["shield-checkmark-outline","Privacy & security",""],
  ["information-circle-outline","About PheleCheck",""]
] as const;

export default function SettingsScreen(){
 const scheme=useColorScheme()==="dark"?"dark":"light"; const c=colors[scheme];
 return <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]} edges={["top","left","right"]}>
   <View style={styles.header}><Text style={[styles.title,{color:c.text}]}>Settings</Text></View>
   <View style={styles.body}>
     <View style={[styles.profile,{backgroundColor:c.surface,borderColor:c.border}]}>
       <View style={[styles.avatar,{backgroundColor:c.surfaceMuted}]}><Ionicons name="person-outline" size={25} color={c.text}/></View>
       <View style={{flex:1}}><Text style={[styles.profileTitle,{color:c.text}]}>PheleCheck account</Text><Text style={[styles.profileText,{color:c.textMuted}]}>Sign in will be added with Supabase</Text></View>
       <Ionicons name="chevron-forward" size={18} color={c.textMuted}/>
     </View>
     <View style={[styles.list,{backgroundColor:c.surface,borderColor:c.border}]}>
       {rows.map(([icon,label,value],i)=><Pressable key={label} style={[styles.row,i>0&&{borderTopWidth:StyleSheet.hairlineWidth,borderTopColor:c.border}]}>
         <Ionicons name={icon} size={20} color={c.text}/><Text style={[styles.rowLabel,{color:c.text}]}>{label}</Text>
         {value?<Text style={[styles.value,{color:c.textMuted}]}>{value}</Text>:null}<Ionicons name="chevron-forward" size={17} color={c.textMuted}/>
       </Pressable>)}
     </View>
     <Text style={[styles.version,{color:c.textMuted}]}>PheleCheck 1.0.0</Text>
   </View>
   <BottomNav active="settings"/>
 </SafeAreaView>
}
const styles=StyleSheet.create({
 safe:{flex:1},header:{height:64,paddingHorizontal:spacing.lg,justifyContent:"center"},title:{fontSize:24,fontWeight:"800"},
 body:{flex:1,paddingHorizontal:spacing.lg},profile:{marginTop:14,borderWidth:1,borderRadius:radius.lg,padding:16,flexDirection:"row",alignItems:"center",gap:12},
 avatar:{width:50,height:50,borderRadius:16,alignItems:"center",justifyContent:"center"},profileTitle:{fontSize:15,fontWeight:"800"},profileText:{fontSize:12,marginTop:3},
 list:{marginTop:16,borderWidth:1,borderRadius:radius.lg,paddingHorizontal:16},row:{height:58,flexDirection:"row",alignItems:"center",gap:12},
 rowLabel:{flex:1,fontSize:14,fontWeight:"600"},value:{fontSize:12},version:{fontSize:12,textAlign:"center",marginTop:18}
});
