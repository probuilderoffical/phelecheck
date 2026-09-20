import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BottomNav } from "@/components/BottomNav";
import { useAppTheme } from "@/providers/AppPreferences";
import { getHistory, type HistoryItem } from "@/services/history";
import { radius, spacing } from "@/theme";

export default function HistoryScreen() {
  const { colors:c }=useAppTheme();
  const [items,setItems]=useState<HistoryItem[]>([]);

  useFocusEffect(useCallback(()=>{ getHistory().then(setItems); },[]));

  return <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]} edges={["top","left","right"]}>
    <View style={styles.header}><Text style={[styles.title,{color:c.text}]}>History</Text></View>
    <ScrollView contentContainerStyle={styles.body}>
      {items.length===0?
        <View style={[styles.empty,{backgroundColor:c.surface,borderColor:c.border}]}>
          <View style={[styles.icon,{backgroundColor:c.surfaceMuted}]}><Ionicons name="time-outline" size={27} color={c.text}/></View>
          <Text style={[styles.emptyTitle,{color:c.text}]}>No checks yet</Text>
          <Text style={[styles.emptyText,{color:c.textMuted}]}>Your recent PheleCheck analyses will appear here.</Text>
        </View>
      : items.map(item=><Pressable key={item.id} onPress={()=>router.push({pathname:"/result",params:{sample:item.inputPreview,type:item.type}})} style={[styles.item,{backgroundColor:c.surface,borderColor:c.border}]}>
          <View style={[styles.riskDot,{backgroundColor:item.analysis.riskLevel==="high"?c.danger:item.analysis.riskLevel==="caution"?c.warning:c.success}]}/>
          <View style={{flex:1}}>
            <Text style={[styles.itemTitle,{color:c.text}]} numberOfLines={1}>{item.inputPreview}</Text>
            <Text style={[styles.itemMeta,{color:c.textMuted}]}>{item.analysis.model} • {item.analysis.riskLevel} • {new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.textMuted}/>
        </Pressable>)}
    </ScrollView>
    <BottomNav active="history"/>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
 safe:{flex:1},header:{height:64,paddingHorizontal:spacing.lg,justifyContent:"center"},title:{fontSize:24,fontWeight:"800"},body:{padding:spacing.lg,gap:10,paddingBottom:30},
 empty:{borderWidth:1,borderRadius:radius.lg,padding:28,alignItems:"center",marginTop:30},icon:{width:58,height:58,borderRadius:18,alignItems:"center",justifyContent:"center"},
 emptyTitle:{fontSize:18,fontWeight:"800",marginTop:16},emptyText:{fontSize:13,lineHeight:19,textAlign:"center",marginTop:6},
 item:{minHeight:72,borderWidth:1,borderRadius:radius.md,padding:14,flexDirection:"row",alignItems:"center",gap:12},riskDot:{width:10,height:10,borderRadius:5},
 itemTitle:{fontSize:14,fontWeight:"700"},itemMeta:{fontSize:11,marginTop:5}
});
