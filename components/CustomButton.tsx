import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'
import { CustomButtonProps } from '@/type'
import clsx from 'clsx'

const CustomButton = ({
  onPress,
  title="Click Me",
  style,
  textStyle,
  isLoading=false,
  leftIcon,
  
}:CustomButtonProps) => {
  return (
    <TouchableOpacity className={clsx('custom-btn',style)} onPress={onPress}>
      {leftIcon}
      <View className='flex-center flex-row'>
        {isLoading?(
          <ActivityIndicator size="small" color="white" />
        ):(
          <Text  className={clsx('text-white-100 paragraph-semibold',textStyle)}>
            {title}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default CustomButton