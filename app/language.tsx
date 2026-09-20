import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppPreferences, useAppTheme } from "@/providers/AppPreferences";
import { supportedLanguages } from "@/i18n";
import { radius, spacing } from "@/theme";

export default function LanguageScreen(){
  const {colors:c}=useAppTheme();
  const {preferences,setPreference}=useAppPreferences();
  return <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]}>
    <View style={styles.header}>
      <Pressable onPress={()=>router.back()} style={styles.back}><Ionicons name="arrow-back" size={23} color={c.text}/></Pressable>
      <Text style={[styles.title,{color:c.text}]}>Language</Text><View style={styles.back}/>
    </View>
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={[styles.help,{color:c.textMuted}]}>PheleCheck will answer in the selected language. Automatic language detection will be added to Sentinel-1 responses.</Text>
      <View style={[styles.list,{backgroundColor:c.surface,borderColor:c.border}]}>
        {supportedLanguages.map((o,i)=>{
          const selected=preferences.language===o.code;
          return <Pressable key={o.code} onPress={()=>setPreference("language",o.code)} style={[styles.row,i>0&&{borderTopColor:c.border,borderTopWidth:StyleSheet.hairlineWidth}]}>
            <Text style={[styles.label,{color:c.text}]}>{o.label}</Text>
            <Ionicons name={selected?"checkmark-circle":"ellipse-outline"} size={21} color={selected?c.text:c.textMuted}/>
          </Pressable>
        })}
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
 safe:{flex:1},header:{height:60,paddingHorizontal:spacing.lg,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{width:40,height:40,alignItems:"center",justifyContent:"center"},title:{fontSize:17,fontWeight:"800"},
 body:{padding:spacing.lg,paddingBottom:30},help:{fontSize:13,lineHeight:19,marginBottom:16},list:{borderWidth:1,borderRadius:radius.lg,overflow:"hidden"},row:{height:56,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},label:{fontSize:14,fontWeight:"600"}
});
