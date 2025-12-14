import { View, Text, TextInput } from 'react-native';
import React, { useState } from 'react';
import { CustomInputProps } from '@/type';
import clsx from 'clsx';
    

const CustomInput = ({
  placeholder = 'Enter Text',
  value,
  onChangeText,
  label,
  secureTextEntry = false,
  keyboardType = 'default',
}:CustomInputProps) => {
  const [isFoucused, setIsFocused] = useState(false);
  return (
    <View className='w-full'>
      <Text className='label'>{label}</Text>
      <TextInput
        autoCapitalize='none'
        autoCorrect={false}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#888"
        className={clsx('input',isFoucused? 'border-primary':'border-gray-300') }
      />
    </View>
  );
};

export default CustomInput;
