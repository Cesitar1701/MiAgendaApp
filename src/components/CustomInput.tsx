import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface Props extends TextInputProps {
    label: string;
}

export default function CustomInput({ label, style, ...props }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
        <TextInput style={[styles.input, style]} placeholderTextColor="#ccc" {...props} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 16,   
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: '#0F172A',
    },
});