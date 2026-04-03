import { StyleSheet } from "react-native";
import { componentStyles } from "./App.styles.components";
import { layoutStyles } from "./App.styles.layout";

const styles = StyleSheet.create({
  ...layoutStyles,
  ...componentStyles
});

export default styles;
