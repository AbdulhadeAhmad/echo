package misc

import "crypto/rand"

const letters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

func RandomString(n int) (string, error) {
	bytes := make([]byte, n)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	for i := range n {
		bytes[i] = letters[int(bytes[i])%len(letters)]
	}

	return string(bytes), nil
}
