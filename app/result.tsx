import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { radius, spacing } from "@/theme";
import { useAppPreferences, useAppTheme } from "@/providers/AppPreferences";
import { analyzeWithSentinel } from "@/services/sentinel";
import type { RiskAnalysis } from "@/services/riskEngine";
import { saveHistoryItem } from "@/services/history";
import { rememberAnalysis } from "@/services/memory";
import { supabase } from "@/lib/supabase";
import { takePendingInput } from "@/services/pendingCheck";
import { redactSensitiveText } from "@/services/redaction";

function severityColor(severity: "info" | "warning" | "danger", c: any) {
  if (severity === "danger") return c.danger;
  if (severity === "warning") return c.warning;
  return c.textMuted;
}

export default function ResultScreen() {
  const { sample, type, pendingKey } = useLocalSearchParams<{ sample?: string; type?: string; pendingKey?: string }>();
  const { scheme, colors: c } = useAppTheme();
  const { preferences } = useAppPreferences();
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const pending = pendingKey ? await takePendingInput(pendingKey) : null;
      const text = sample?.trim() || pending?.text?.trim() || "";
      const result = await analyzeWithSentinel(
        pending
          ? {
              text,
              inputType: pending.inputType,
              imageBase64: pending.imageBase64,
              mimeType: pending.mimeType
            }
          : text,
        preferences.language
      );
      if (!active) return;
      setAnalysis(result);
      setLoading(false);

      if (preferences.saveHistory) {
        await saveHistoryItem({
          id: String(Date.now()),
          createdAt: new Date().toISOString(),
          type: type ?? "message",
          inputPreview: pending ? `[${pending.inputType} image]` : text.slice(0, 220),
          analysis: result
        });
      }
      if (preferences.memoryEnabled) await rememberAnalysis(result, preferences.language);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && (preferences.saveHistory || preferences.improvePheleCheck)) {
        await supabase.functions.invoke("record-check", {
          body: {
            inputType: type ?? "message",
            inputPreview: pending ? `[${pending.inputType} image]` : redactSensitiveText(text).slice(0, 220),
            analysis: result,
            saveHistory: preferences.saveHistory
          }
        });
      }
    })();
    return () => { active = false; };
  }, [sample, type, pendingKey, preferences.language, preferences.memoryEnabled, preferences.saveHistory, preferences.improvePheleCheck]);

  if (loading || !analysis) {
    return (
      <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={c.text}/>
          <Text style={[styles.loadingTitle,{color:c.text}]}>Analyzing risk</Text>
          <Text style={[styles.loadingText,{color:c.textMuted}]}>Sentinel-1 is checking the available signals.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const riskColor = analysis.riskLevel === "high" ? c.danger : analysis.riskLevel === "caution" ? c.warning : analysis.riskLevel === "low" ? c.success : c.textMuted;
  const riskTitle = analysis.riskLevel === "high" ? "High risk" : analysis.riskLevel === "caution" ? "Caution" : analysis.riskLevel === "low" ? "Low risk signals" : "Unable to verify";

  return (
    <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]} edges={["top","left","right","bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={()=>router.back()} style={styles.headerIcon}><Ionicons name="arrow-back" size={23} color={c.text}/></Pressable>
        <Text style={[styles.headerTitle,{color:c.text}]}>Analysis</Text>
        <View style={styles.headerIcon}/>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.summary,{backgroundColor:c.surface,borderColor:c.border}]}>
          <View style={styles.summaryTop}>
            <View style={[styles.riskIcon,{backgroundColor:riskColor+"18"}]}><Ionicons name="shield-checkmark" size={25} color={riskColor}/></View>
            <View style={{flex:1}}>
              <Text style={[styles.kicker,{color:c.textMuted}]}>RISK LEVEL</Text>
              <Text style={[styles.riskTitle,{color:c.text}]}>{riskTitle}</Text>
            </View>
            <View style={[styles.score,{backgroundColor:c.surfaceMuted}]}>
              <Text style={[styles.scoreValue,{color:c.text}]}>{analysis.score}</Text>
              <Text style={[styles.scoreLabel,{color:c.textMuted}]}>/100</Text>
            </View>
          </View>

          <Text style={[styles.summaryText,{color:c.textMuted}]}>{analysis.summary}</Text>

          <View style={[styles.modelRow,{borderTopColor:c.border}]}>
            <Text style={[styles.modelText,{color:c.textMuted}]}>{analysis.model} • {analysis.source === "sentinel" ? "GPU model" : "Local fallback"}</Text>
            <Text style={[styles.modelText,{color:c.textMuted}]}>Confidence {analysis.confidence}%</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle,{color:c.text}]}>Risk signals</Text>
        <View style={[styles.card,{backgroundColor:c.surface,borderColor:c.border}]}>
          {analysis.signals.map((signal,index)=>{
            const color=severityColor(signal.severity,c);
            return <View key={signal.title}>
              {index>0?<View style={[styles.divider,{backgroundColor:c.border}]}/>:null}
              <View style={styles.bullet}>
                <View style={[styles.bulletIcon,{backgroundColor:color+"18"}]}><Ionicons name={signal.severity==="danger"?"warning":"alert-circle-outline"} size={18} color={color}/></View>
                <View style={{flex:1}}>
                  <Text style={[styles.bulletTitle,{color:c.text}]}>{signal.title}</Text>
                  <Text style={[styles.bulletText,{color:c.textMuted}]}>{signal.detail}</Text>
                </View>
              </View>
            </View>;
          })}
        </View>

        {analysis.webEvidence?.length ? <>
          <Text style={[styles.sectionTitle,{color:c.text}]}>Live web evidence</Text>
          <View style={[styles.card,{backgroundColor:c.surface,borderColor:c.border}]}>
            {analysis.webEvidence.map((item,index)=>{
              const bad=item.maliciousMatches>0;
              return <View key={item.domain}>
                {index>0?<View style={[styles.divider,{backgroundColor:c.border}]}/>:null}
                <View style={styles.bullet}>
                  <View style={[styles.bulletIcon,{backgroundColor:(bad?c.danger:c.textMuted)+"18"}]}>
                    <Ionicons name={bad?"warning":"globe-outline"} size={18} color={bad?c.danger:c.textMuted}/>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={[styles.bulletTitle,{color:c.text}]}>{item.domain}</Text>
                    <Text style={[styles.bulletText,{color:c.textMuted}]}>{item.summary}</Text>
                  </View>
                </View>
              </View>;
            })}
          </View>
        </> : null}

        <Text style={[styles.sectionTitle,{color:c.text}]}>What to do next</Text>
        <View style={[styles.card,{backgroundColor:c.surface,borderColor:c.border}]}>
          {analysis.actions.map((item,i)=><View key={item} style={[styles.step,i>0&&{borderTopColor:c.border,borderTopWidth:StyleSheet.hairlineWidth}]}>
            <View style={[styles.stepNumber,{backgroundColor:c.surfaceMuted}]}><Text style={[styles.stepNumberText,{color:c.text}]}>{i+1}</Text></View>
            <Text style={[styles.stepText,{color:c.text}]}>{item}</Text>
          </View>)}
        </View>

        {sample ? <>
          <Text style={[styles.sectionTitle,{color:c.text}]}>Checked content</Text>
          <View style={[styles.quote,{backgroundColor:c.surfaceMuted}]}><Text numberOfLines={6} style={[styles.quoteText,{color:c.text}]}>{sample}</Text></View>
        </> : null}

        <View style={[styles.note,{borderColor:c.border}]}>
          <Ionicons name="information-circle-outline" size={19} color={c.textMuted}/>
          <Text style={[styles.noteText,{color:c.textMuted}]}>A risk score is guidance, not a guarantee. Verify independently before sending money or sharing sensitive information.</Text>
        </View>

        <Pressable onPress={()=>router.replace("/")} style={[styles.primary,{backgroundColor:c.text}]}>
          <Text style={[styles.primaryText,{color:scheme==="dark"?"#111":"#fff"}]}>Check something else</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
 safe:{flex:1},loading:{flex:1,alignItems:"center",justifyContent:"center",padding:30},loadingTitle:{fontSize:20,fontWeight:"800",marginTop:18},loadingText:{fontSize:13,marginTop:6,textAlign:"center"},
 header:{height:60,paddingHorizontal:spacing.lg,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},headerIcon:{width:40,height:40,alignItems:"center",justifyContent:"center"},headerTitle:{fontSize:17,fontWeight:"800"},
 scroll:{paddingHorizontal:spacing.lg,paddingBottom:34},summary:{marginTop:10,borderWidth:1,borderRadius:radius.lg,padding:18},summaryTop:{flexDirection:"row",alignItems:"center",gap:12},
 riskIcon:{width:48,height:48,borderRadius:16,alignItems:"center",justifyContent:"center"},kicker:{fontSize:10,fontWeight:"800",letterSpacing:1.1},riskTitle:{fontSize:20,fontWeight:"800",marginTop:3},
 score:{minWidth:58,height:58,borderRadius:17,alignItems:"center",justifyContent:"center"},scoreValue:{fontSize:20,fontWeight:"800"},scoreLabel:{fontSize:10,marginTop:-2},
 summaryText:{fontSize:14,lineHeight:20,marginTop:16},modelRow:{borderTopWidth:StyleSheet.hairlineWidth,marginTop:16,paddingTop:12,flexDirection:"row",justifyContent:"space-between",gap:8},modelText:{fontSize:10,flexShrink:1},
 sectionTitle:{fontSize:16,fontWeight:"800",marginTop:24,marginBottom:10},card:{borderWidth:1,borderRadius:radius.lg,paddingHorizontal:16},bullet:{flexDirection:"row",gap:12,paddingVertical:16},
 bulletIcon:{width:38,height:38,borderRadius:12,alignItems:"center",justifyContent:"center"},bulletTitle:{fontSize:14,fontWeight:"800"},bulletText:{fontSize:13,lineHeight:18,marginTop:4},
 divider:{height:StyleSheet.hairlineWidth,marginLeft:50},step:{minHeight:60,flexDirection:"row",alignItems:"center",gap:12},stepNumber:{width:28,height:28,borderRadius:14,alignItems:"center",justifyContent:"center"},
 stepNumberText:{fontSize:12,fontWeight:"800"},stepText:{flex:1,fontSize:14,fontWeight:"600"},quote:{borderRadius:radius.md,padding:16},quoteText:{fontSize:14,lineHeight:21},
 note:{marginTop:22,paddingTop:18,borderTopWidth:1,flexDirection:"row",gap:10},noteText:{flex:1,fontSize:12,lineHeight:18},primary:{height:54,borderRadius:27,alignItems:"center",justifyContent:"center",marginTop:24},primaryText:{fontSize:15,fontWeight:"800"}
});
