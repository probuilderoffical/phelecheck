import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppPreferences, useAppTheme, type AppearanceMode } from "@/providers/AppPreferences";
import { radius, spacing } from "@/theme";

const options: {key: AppearanceMode; label: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap}[] = [
  { key:"light", label:"Light", subtitle:"Always use the light theme", icon:"sunny-outline" },
  { key:"dark", label:"Dark", subtitle:"Always use the dark theme", icon:"moon-outline" },
  { key:"system", label:"System", subtitle:"Follow your phone appearance", icon:"phone-portrait-outline" }
];

export default function AppearanceScreen(){
  const {colors:c}=useAppTheme();
  const {preferences,setPreference}=useAppPreferences();
  return <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]}>
    <View style={styles.header}>
      <Pressable onPress={()=>router.back()} style={styles.back}><Ionicons name="arrow-back" size={23} color={c.text}/></Pressable>
      <Text style={[styles.title,{color:c.text}]}>Appearance</Text><View style={styles.back}/>
    </View>
    <View style={styles.body}>
      {options.map(o=>{
        const selected=preferences.appearance===o.key;
        return <Pressable key={o.key} onPress={()=>setPreference("appearance",o.key)} style={[styles.row,{backgroundColor:c.surface,borderColor:selected?c.text:c.border}]}>
          <View style={[styles.icon,{backgroundColor:c.surfaceMuted}]}><Ionicons name={o.icon} size={21} color={c.text}/></View>
          <View style={{flex:1}}><Text style={[styles.label,{color:c.text}]}>{o.label}</Text><Text style={[styles.subtitle,{color:c.textMuted}]}>{o.subtitle}</Text></View>
          <Ionicons name={selected?"checkmark-circle":"ellipse-outline"} size={22} color={selected?c.text:c.textMuted}/>
        </Pressable>
      })}
    </View>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
 safe:{flex:1},header:{height:60,paddingHorizontal:spacing.lg,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{width:40,height:40,alignItems:"center",justifyContent:"center"},title:{fontSize:17,fontWeight:"800"},
 body:{padding:spacing.lg,gap:10},row:{minHeight:78,borderWidth:1,borderRadius:radius.md,padding:14,flexDirection:"row",alignItems:"center",gap:12},icon:{width:42,height:42,borderRadius:14,alignItems:"center",justifyContent:"center"},label:{fontSize:15,fontWeight:"800"},subtitle:{fontSize:12,marginTop:4}
});
