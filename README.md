# `MaskedInputPlus`

A [React](http://facebook.github.io/react/) component for `<input>` masking,
forked from [react-masked-input](https://github.com/insin/react-maskedinput)
and built on top of [inputmask-core](https://github.com/insin/inputmask-core).

Additional feature: ability to paste strings with any allowed space-characters or without it.

## Install

### npm

```
npm install react-maskedinput-plus --save
```

## Usage

Give `MaskedInput` a [`pattern`](#pattern-string) and an `onChange` callback:

This widget can accept +7123-123-12-12, 71231232323, 7 (123) 123-23-23, +7123 123 23 23, etc...

```javascript
import React from 'react'
import MaskedInput from 'react-maskedinput-plus'
import cn from 'classnames'
import e164 from 'e164'

const PHONE_PATTERN = '+1 111 111 11 11'
const NON_DATA_MASK = '[^\\d]+'
const NON_DATA_PATTERN = new RegExp(NON_DATA_MASK)
const UNKNOWN_COUNTRY = 'UNKNOWN'

function getPhoneCountry(phone: string): string {
    const formatted = phone.replace(NON_DATA_PATTERN, '')
    const result = e164.lookup(formatted)

    return result ? result.code : UNKNOWN_COUNTRY
}

export default class Phone extends React.Component {
    render() {
        const {
            id,
            name,
            onChange,
            value
        } = this.props

        return (
            <MaskedInput
                className={cn({
                    ['country-' + getPhoneCountry(value)]: true
                })}
                id ={id}
                name={name}
                onChange={onChange}
                pattern={PHONE_PATTERN}
                nonDataMask = {NON_DATA_MASK}
                validate={v => getPhoneCountry(v) !== UNKNOWN_COUNTRY}
                size="17"
                value={value}
            />
        )
    }
}
```

