import {TouchableOpacity, Text, StyleSheet, TouchableOpacityProps} from 'react-native';

interface Props extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'danger';
}

export default function CustomButton({ title, variant = 'primary', style, ...props }: Props) {
    const getBackgroundColor = () => {
        switch (variant) {
            case 'primary':
                return '#3B82F6'; // Azul
            case 'secondary':
                return '#64748B'; // Gris
            case 'danger':
                return '#EF4444'; // Rojo
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor: getBackgroundColor() }, style]}
            activeOpacity={0.8}
            {...props}
        >
            <Text style={styles.text}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 6,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});